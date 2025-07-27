# Front-end Service Migration – Live Checklist

## ✅ Completed
- Core clients registered in `ServiceContainer` (`apiClient`, `jobsWebSocketClient`).
- `JobWebSocketService` implemented and registered as `jobSocketService`.
- `vmService` registered as singleton in `ServiceContainer` (path `modules/vm/services/VMService.js`).
- `vmStore` migrated to use `vmService` (`/api/ssh-hosts`, `/api/ssh-hosts/:alias/test`).
- `commandStore` migrated to use `apiClient` directly (`/api/vms/{vmId}/commands`, `/api/commands`).
- `Dashboard` and `ExecutionPanel` fully on DI stack.
- Legacy `WebSocketService.js` removed from runtime (file still exists on disk – see To-Do).
- CRUD Commands UI implemented (Add, Edit, Delete) integrated with `commandStore` and `ExecutionPanel`.
- Frontend services split: `SshHostService`, `VmsService`, `CommandService` registered in `ServiceContainer`.
- Automatic VM registration: `VMService.ensureRegistered()` + backend startup sync now guarantee SSH hosts are registered in `/api/vms`.

---
## 🚧 Remaining Blocking Gaps
- Duplicate `execute-command` emit in `Dashboard.handleExecuteCommand()` – currently double-fires a job.
- Stale deprecated files on disk (`WebSocketService.js`, docs in `docs/deprecated/`).

---
## 🔑 Immediate Actions
1. **Remove duplicate emit**
   * Edit `frontend/src/lib/components/Dashboard.svelte` → delete `jobSocketService.emit('execute-command', …)` line.  
   * Confirm execute path uses only `ExecutionPanel → jobSocketService.executeCommand()`.  
2. **Smoke-test VM list endpoint**  
   * `/api/ssh-hosts` → VM list populates & scrolls.

---
## 🔄 Work In Progress
- [x] `/api/vms/{vmId}/commands` → commands load; execute via WebSocket; logs stream.
  * Execute button now calls `jobService.executeCommand()`; logs stream reactively.

- [x] Service layer completeness
  * `JobService` exposes `executeCommand`, `getCurrentJob`, `getLogLines`, `getConnectionStatus`.
  * UI components now use `jobService` via DI; legacy socket references removed.
  * TODO: design persistent caching for `currentJob` beyond WebSocket lifetime.

---
## 📝 Next Wave / PRD Polish
- Job History: enhance UI & hit `/api/jobs` + `/api/vms/{vmId}/jobs` (pagination, replay, filters).
- Command templates CRUD UI using `/api/commands` endpoints.
- UI addition: SSH connection-test modal calling `/api/ssh-hosts/{alias}/test`.
- Delete `SSHHostService` class + remaining `ApiService` subclasses after confirm no imports.
- Strip excessive console logs / auto comments from service files.
- Add integration tests for `VMService`, `commandStore`, container wiring.

---
*(Keep this file updated after each task so everyone stays on the same page.)*