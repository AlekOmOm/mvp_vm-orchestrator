# DATABASE.PRD.md  
Authoritative one-pager describing how data is stored and accessed in the VM-Orchestrator project after the “Users-only in Postgres” decision and the new session requirements.

---

## 1. Logical Overview

```
Frontend (SvelteKit) ──HTTP──►  Node.js / Express
                               ├── users_router  ──►  PostgreSQL   (users)
                               └── all_other     ──►  AWS DynamoDB (vms, commands, jobs, logs)
```

Key points  
- Authentication = classic **stateful** session (cookie) via `express-session`.  
- No JWT, no Redis / DB session store; we rely on the in-memory `MemoryStore` for now (adequate for one-instance dev & demo).  
- After a successful login the backend places the **AWS access keys** for that user into the session object so every subsequent request is already authorised to talk to DynamoDB / Lambda.  
- DynamoDB & Lambda live in real AWS; we do **not** run DynamoDB-Local in dev.

---

## 2. PostgreSQL (self-hosted, GDPR sensitive)

### 2.1 DDL

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','dev','viewer')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

Nothing else persists in Postgres.

---

## 3. DynamoDB (operational, AWS)

| Table | PK | SK | GSIs (examples) | TTL attr | Notes |
|-------|----|----|-----------------|----------|-------|
| `vms`        | `vmId`      | —   | `byEnvironment`        | —          | Catalogue of machines |
| `commands`   | `commandId` | —   | `byVmId`               | —          | Declarative commands  |
| `jobs`       | `jobId`     | —   | `byVmId`, `byStatus`   | `expiresAt`| Execution metadata    |
| `jobEvents`  | `jobId`     | `ts`| —                      | `expiresAt`| Streaming logs        |

All tables are **on-demand** capacity.

---

## 4. Session & Authentication Flow

1. `POST /api/users/login`  
   - Verifies credentials against Postgres.  
   - Reads the user’s AWS creds (for now: `accessKeyId`, `secretAccessKey`, `sessionToken?`) from `.env`, another secret store, or a small lookup table in Postgres.  
   - Stores  
     ```js
     req.session.user = { id, role };
     req.session.aws  = { accessKeyId, secretAccessKey, sessionToken };
     ```  
   - Returns `200 OK` (no JWT).

2. Subsequent requests  
   - `express-session` middleware restores `req.session`.  
   - DynamoDB helper uses `new DynamoDBClient({ credentials: req.session.aws })`.  
   - If the session expires or is destroyed, access to DynamoDB is lost automatically.

3. Logout  
   - `POST /api/users/logout` → `req.session.destroy()` → cookie cleared.

Important: because sessions live in RAM, restarting the backend logs everyone out.

---

## 5. REST Route Ownership

| Route prefix | Backing store | Controller |
|--------------|--------------|------------|
| `/api/users/**` | Postgres | `users_router.js` |
| all others (`/api/vms/**`, `/api/commands/**`, `/api/jobs/**`, …) | DynamoDB (via AWS SDK) | individual routers |

---

## 6. Minimal Dev Setup

1. `.env` must contain  
   ```
   POSTGRES_USER=…
   POSTGRES_PASSWORD=…
   POSTGRES_DB=…
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432

   # Default AWS creds issued to every dev user in local dev
   AWS_ACCESS_KEY_ID=…
   AWS_SECRET_ACCESS_KEY=…
   AWS_REGION=us-east-1
   ```
   In production the per-user keys are fetched during `/login`.

2. `docker-compose up postgres` to start the only local service.

3. `npm run dev` starts Express with hot reload.

No local DynamoDB; all calls hit AWS.

---

## 7. Responsibilities

Backend developer  
- Maintain Express routers and session middleware.  
- Provide helper that instantiates AWS SDK clients from `req.session.aws`.  
- Secure `/login` so that incorrect creds never obtain AWS keys.

Frontend developer  
- Use the same `/api/**` OpenAPI surface.  
- Store nothing client-side except the session cookie automatically set by Express.

---
This document is the single source of truth for how data is stored and accessed in the project.