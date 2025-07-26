<!-- docs/user-stories.md -->

# VM-Orchestrator – User Stories (MVP)

## 1. Personas

### Developer (DEV)
- Works on application projects that expose common `make` targets  
- Occasionally spawns or SSHs into disposable VMs for testing  
- Pain today: multiple terminal tabs, forgotten commands, lost logs

### Infrastructure Engineer (INFRA)
- Maintains IaC repositories (`terraform-dev-server`, `vm-config`) and base VM images  
- Needs instant visibility into VM fleet state and a one-click way to run remote fixes  
- Pain today: juggling terraform state, inventory files and many ad-hoc log tails

---

## 2. Core Value Propositions

1. **VM Overview** – Single list of VMs with name, IP and power state  
2. **Project Overview** – List of local Makefile projects and remote projects on each VM  
3. **Unified Command Execution** – Pick `make` target, choose “local” or “on VM X”, click Run, watch output  
4. **Easy Log Retrieval** – Pre-defined “tail docker logs” or `journalctl` actions per service, no SSH skills needed

---

## 3. MVP User Stories (rank-ordered)

| ID | Persona | Story | Acceptance Criteria |
|----|---------|-------|---------------------|
| U1-DEV | DEV | *VM Browser* – View every VM with name, IP, power state | List loads in < 1 s |
| U2-DEV | DEV | *Local Make Target* – Run `make test` locally, see live stdout/stderr | First chunk in UI < 1 s |
| U3-DEV | DEV | *Remote Make Target* – Run `make migrate` on VM “dev-01” | SSH strategy used, job stored |
| U4-DEV | DEV | *Log Follow* – Click “docker logs -f web” on VM “dev-01” | Stream starts < 2 s, cancel works |
| U5-INFRA | INFRA | *Fleet Health* – See running vs stopped VM counters | Badges update every refresh |
| U6-INFRA | INFRA | *IaC Apply* – Run `terraform apply` on IaC VM | Plan opens terminal, apply streams |
| U7 | Any | *Job History* – Reload and replay last 10 jobs | Data loads < 2 s from Postgres |
| U8 | Any | *Kill Switch* – Cancel a running job from UI | Job row flips to “canceled” |

---

## 4. Stories Explicitly Out of Scope (MVP)

- Multi-tenant RBAC  
- Automated VM provisioning  
- Graphical log analytics  
- Mobile viewport optimisation  
- Windows PowerShell support for interactive spawn

---

## 5. Complexity Guardrails

- Exactly two top-level nav items: **VMs** and **Projects** (plus implicit **Job History** panel)  
- Each screen fetches from at most one REST endpoint; everything else via WebSocket  
- One click = one action; no nested wizards or multi-step modals
