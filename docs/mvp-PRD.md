<!-- docs/MVP-PRD.md -->

# VM-Orchestrator — MVP PRD  
Version 1.0 – Owner: **YOU** – Last update: 2025-07-26  

The detailed user stories live in [`user-stories.md`](./user-stories.md).

---

## 1. Vision & Goals

- Vision  
  - Offer a lightweight cockpit where any engineer can manage VMs, run **make** targets locally or remotely, tail logs in real time and keep an auditable history.

- MVP Goal  
  - Re-implement the PoC with robust error handling, multi-user safety and a one-command Docker-Compose deployment.

---

## 2. Success Metrics

- 100 % automated-test pass rate  
- ≤ 1 s latency from process output to browser display on a LAN  
- ≥ 95 % unit-test coverage for the execution manager  
- `docker compose up` to first successful command in ≤ 60 s on a fresh laptop  
- ≤ 10 MB RAM per concurrent job under normal load

---

## 3. Functional Requirements

F1. WebSocket  
- `execute-command` → backend selects strategy (spawn, stream, SSH)  
- `job:log`  → `{jobId, stream, chunk, ts}`  
- `job:done` → `{jobId, status, exitCode}`  

F2. REST  
- `GET /api/jobs?limit=N` → last **N** jobs  
- `POST /api/jobs/cancel` → `{ jobId }`  

F3. Execution Layer  
- `TerminalSpawnStrategy` for interactive commands  
- `LocalStreamStrategy` for non-interactive local commands  
- `SshStreamStrategy` for remote commands/log tails  

F4. Persistence  
- `jobs` and `job_events` tables with indexes and foreign keys (see §6)  

F5. UI  
- CommandPanel disables buttons while a job is active  
- LogViewer colours stdout, stderr and system lines distinctly and supports pause/scroll  
- JobHistory table with manual refresh plus 30 s auto-poll  

F6. Settings (hidden)  
- Modal lets user override backend URL; value stored in `localStorage`  

F7. Security  
- No secrets shipped to the client  
- CORS locked to the frontend origin

---

## 4. Non-Functional Requirements

- Handle 5 concurrent jobs emitting 1 kB · s\(^{-1}\) each without data loss  
- Backend retries failed DB writes up to 3× before marking an event *error*  
- Runs on macOS 13 +, Ubuntu 22.04 +, WSL2  
- Colour-blind-safe status badges  
- ESLint + Prettier gate; JSDoc typing (TypeScript optional)

---

## 5. Architecture Snapshot

```text
Frontend (Svelte / Vite)
          ⇅ Socket.io (JSON)
Backend  (Node / Express)
          ⇆ Postgres 16  ── jobs, job_events

Execution Strategies
  ├─ TerminalSpawnStrategy
  ├─ LocalStreamStrategy
  └─ SshStreamStrategy
```

---

## 6. Data Model (Postgres 16)

```sql
-- Main job metadata
CREATE TABLE jobs (
  id          UUID PRIMARY KEY,
  command     TEXT                       NOT NULL,
  type        TEXT CHECK (type IN ('stream','terminal','ssh')),
  status      TEXT,
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  exit_code   INTEGER
);

-- Time-series output
CREATE TABLE job_events (
  id       BIGSERIAL PRIMARY KEY,
  job_id   UUID REFERENCES jobs(id) ON DELETE CASCADE,
  ts       TIMESTAMPTZ DEFAULT NOW(),
  stream   TEXT,       -- stdout | stderr | system
  chunk    TEXT
);

CREATE INDEX idx_job_events_job_id_ts ON job_events(job_id, ts);
CREATE INDEX idx_jobs_status            ON jobs(status);
```

---

## 7. Milestones & Timeline (14 days)

- Day 1-2 – Repo scaffold, CI, lint-format hook  
- Day 3-5 – ExecutionManager refactor, unit tests  
- Day 6-7 – WebSocket namespace `/jobs`, reconnect logic  
- Day 8-9 – Svelte UI (CommandPanel, LogViewer, JobHistory)  
- Day 10  – Cancel-job flow, graceful SIGTERM  
- Day 11-12 – Polish, accessibility pass, README GIF, compose file  
- Day 13 – Regression + load test, tag `v0.1-MVP`  
- Day 14 – Buffer, bug-fixing, demo rehearsal

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Terminal spawn fails on non-GNOME Linux | Fallback to `$TERM_CMD` env variable |
| Log table grows unbounded | Nightly cron prunes events older than 30 days |
| WebSocket flooding | Pause stdout read when socket buffer > 1 MB |

---

## 9. Open Questions

- Do we need Windows interactive-spawn support soon?  
- Should job history become per-user once authentication is added?  
- Will auditors mandate encrypted WebSocket (`wss`) on demo day?