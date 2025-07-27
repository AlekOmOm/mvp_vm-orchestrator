# Frontend status report  
(scope limited to the listed files)

──────────────────────────
CORE LAYER
──────────────────────────
1. ApiClient.js  
   • Thin wrapper around fetch with retry / timeout / interceptors.  
   • Registered as singleton `apiClient` in `ServiceContainer`.  
   • Consumers: `ApiService` (legacy), `VMService` (business), any code using `serviceContainer.get('apiClient')`.

2. WebSocketClient.js  
   • Low-level Socket.IO wrapper (`connect / emit / on / off`) with reactive stores.  
   • Registered as singleton `jobsWebSocketClient`.  
   • Consumers: `JobWebSocketService`.

3. ServiceContainer.js  
   • Dependency-injection registry.  
   • Boot flow: create `apiClient` & `jobSocketService`, then call `wsClient.connect()` and wait for `connected`.  
   • Exposes `initializeServices()`, `getService()`, `shutdownServices()`.  
   • Consumers: `Dashboard.svelte`, integration tests.

──────────────────────────
FEATURE SERVICES
──────────────────────────
4. JobWebSocketService.js  
   • Business-logic layer for job execution / history / logs.  
   • Registered as singleton `jobSocketService` (depends on `jobsWebSocketClient`, `apiClient`).  
   • Provides `executeCommand()`, `currentJob`, `logLines`, `jobs`, `commands`.

5. modules/vm/VMService.js  
   • Domain logic for VM discovery, validation, command delegation.  
   • **Not yet registered** in `ServiceContainer`; no component instantiates it.  
   • Will replace `SSHHostService` once wired.

──────────────────────────
LEGACY LAYER (to deprecate)
──────────────────────────
6. ApiService.js + subclasses (`VMService`, `CommandService`, `JobService`, `SSHHostService`)  
   • Backward-compat façade around the new `ApiClient`.  
   • `vmStore`, `commandStore` still import these singleton instances.

7. WebSocketService.js  
   • Marked `@deprecated`; **no runtime imports remain**.

──────────────────────────
UI COMPONENTS
──────────────────────────
8. Dashboard.svelte  
   • Uses `ServiceContainer` exclusively; passes `jobSocketService` down.  
   • TODO: remove duplicate `emit('execute-command', …)` call.

9. ExecutionPanel.svelte  
   • Receives `jobSocketService`; uses `executeCommand()` & `currentJob` store – fully migrated.

10. VM-related panels (`VMManagementPanel`, etc.)  
   • Depend on `vmStore`, which in turn still uses legacy `sshHostService` paths.

──────────────────────────
CURRENT GAPS
──────────────────────────
• `VMService` not registered in container.  
• `vmStore` still uses `sshHostService` instead of `VMService`.  
• `commandStore` uses legacy `commandService`.  
• Duplicate emit in `Dashboard.handleExecuteCommand`.  
• Legacy `ApiService` layer still present.

──────────────────────────
NEXT STEPS
──────────────────────────
1. Register `VMService` singleton in `ServiceContainer` (inject `apiClient`, `jobsWebSocketClient`).  
2. Refactor `vmStore` to depend on `VMService`; update VM panels if interface changes.  
3. Migrate `commandStore` to rely on `JobWebSocketService` / `VMService` where appropriate.  
4. Remove `SSHHostService` and other legacy ApiService subclasses once stores are migrated.  
5. Delete deprecated `WebSocketService.js` and update docs.