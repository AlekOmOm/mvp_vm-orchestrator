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
- **All stores migrated to ServiceContainer**: `vmStore` uses `vmService`, `commandStore` uses `commandService`, `jobStore` and `logStore` implemented with base store pattern.
- **Command execution flow consolidated**: Single path through `CommandExecutionService` → `JobService` → `JobWebSocketService`.

---
## 🚧 Remaining Blocking Gaps
- **CRITICAL**: Multiple command execution paths causing potential duplicate jobs:
  - Path 1: `CommandExecutionView.handleExecute()` → `CommandExecutionService.executeCommand()` → `JobService.executeCommand()` → `JobWebSocketService.executeCommand()`
  - Path 2: `CommandPanel.executeCommand()` → `VMService.executeCommand()` → direct WebSocket emit
  - Path 3: Legacy components may still use old patterns
- Stale deprecated files on disk (`WebSocketService.js`, docs in `docs/deprecated/`).

---
## 🔑 Immediate Actions
1. **Fix duplicate execution paths**
   * **ANALYSIS COMPLETE**: Dashboard.svelte does NOT have duplicate emit - `handleCommandExecute()` only logs
   * **REAL ISSUE**: Two active execution components:
     - `CommandExecutionView` (main path) → `CommandExecutionService` → `JobService` → `JobWebSocketService`
     - `CommandPanel` (legacy path) → `VMService.executeCommand()` → direct WebSocket emit
   * **ACTION**: Deprecate `CommandPanel` or consolidate execution paths
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
## 🔄 Implementation Status Details

### Service Container Architecture ✅
**Current State**: Fully implemented and operational
- `ServiceContainer.js` with proper DI pattern
- All core services registered: `apiClient`, `jobsWebSocketClient`, `vmService`, `jobService`, `commandExecutionService`
- Initialization flow: `Dashboard.onMount()` → `initializeServices()` → WebSocket connection
- Health monitoring via `serviceHealth` store

### Store Migration Status ✅
**vmStore**: Fully migrated (`frontend/src/lib/stores/vmStore.js:43`)
- Uses `vmService` from ServiceContainer
- API calls: `/api/ssh-hosts`, `/api/ssh-hosts/:alias/test`
- Proper loading states and error handling

**commandStore**: Fully migrated (`frontend/src/lib/stores/commandStore.js`)
- Uses `commandService` from ServiceContainer
- API calls: `/api/vms/{vmId}/commands`, `/api/commands`
- CRUD operations implemented

**jobStore**: Implemented (`frontend/src/lib/stores/jobStore.js`)
- Uses base store pattern with proper state management
- Integrates with `JobWebSocketService` for real-time updates
- Caching and statistics tracking

**logStore**: Implemented (`frontend/src/lib/stores/logStore.js`)
- Simple log line management per job (`addLogLine()`, `getLogLinesForJob()`)
- Used by Terminal component for display

### Command Execution Flow Analysis 🚨
**ISSUE CONFIRMED**: Multiple execution paths exist

**Primary Path (Intended)**:
```
CommandExecutionView.handleExecute() [Line 44]
  ↓
CommandExecutionService.executeCommand() [Line 23]
  ↓
JobService.executeCommand() [Line 24]
  ↓
JobWebSocketService.executeCommand() [Line 140]
  ↓
WebSocket emit('execute-command') [Line 170]
```

**Secondary Path (Legacy)**:
```
CommandPanel.executeCommand() [Line 36]
  ↓
VMService.executeCommand() [Line 246]
  ↓
Direct WebSocket emit('execute-command') [Line 249]
```

**Dashboard Event Handlers**: ✅ NO DUPLICATE ISSUE
- `handleCommandExecute()` (Line 32) - Only logs, no WebSocket emit
- No duplicate `execute-command` emit found in Dashboard

### Component Integration Status
**Dashboard.svelte**: ✅ Fully migrated
- Uses `initializeServices()` from ServiceContainer (Line 18)
- Event handlers are passive - no duplicate execution
- Proper error handling in `onMount()`

**ExecutionPanel.svelte**: ✅ Fully migrated
- Uses `jobService` from ServiceContainer (Line 16)
- Integrates with Terminal and JobHistory components

**CommandExecutionView.svelte**: ✅ Main execution path
- Gets `commandExecutionService` via `getService()` (Line 13)
- Proper command execution flow through services
- **This is the PRIMARY execution component**

**CommandPanel.svelte**: ⚠️ **LEGACY PATH ACTIVE**
- Still uses `vmService.executeCommand()` directly (Line 42)
- Bypasses `CommandExecutionService` layer
- **Creates secondary execution path - potential for duplicates**

---
## 📝 Next Wave / PRD Polish
- **Priority 1**: Consolidate command execution paths (remove `CommandPanel` or update to use `CommandExecutionService`)
- Job History: enhance UI & hit `/api/jobs` + `/api/vms/{vmId}/jobs` (pagination, replay, filters)
- Command templates CRUD UI using `/api/commands` endpoints
- UI addition: SSH connection-test modal calling `/api/ssh-hosts/{alias}/test`
- Delete `SSHHostService` class + remaining `ApiService` subclasses after confirm no imports
- Strip excessive console logs / auto comments from service files
- Add integration tests for `VMService`, `commandStore`, container wiring

---
*(Keep this file updated after each task so everyone stays on the same page.)*