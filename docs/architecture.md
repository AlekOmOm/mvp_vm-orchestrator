# VM Orchestrator Frontend Architecture

## Overview

The VM Orchestrator frontend is built with **Svelte 5** using modern runes syntax, implementing a **service-oriented architecture** with **reactive stores** and **component composition patterns**.

---
toc

- [VM Orchestrator Frontend Architecture](#vm-orchestrator-frontend-architecture)
  - [Overview](#overview)
  - [1. Architecture Patterns](#1-architecture-patterns)
    - [1.1 Service Container Pattern](#11-service-container-pattern)
    - [1.2 Reactive Store Pattern](#12-reactive-store-pattern)
    - [1.3 Component Composition](#13-component-composition)
  - [2. Directory Structure Analysis](#2-directory-structure-analysis)
  - [3. Component Architecture](#3-component-architecture)
    - [3.1 Component Hierarchy](#31-component-hierarchy)
    - [3.2 Component Responsibilities](#32-component-responsibilities)
      - [**Layout Components**](#layout-components)
      - [**Domain Components**](#domain-components)
        - [VM Domain (`src/lib/components/vm/`)](#vm-domain-srclibcomponentsvm)
        - [Command Domain (`src/lib/components/command/`)](#command-domain-srclibcomponentscommand)
        - [Job Domain (`src/lib/components/job/`)](#job-domain-srclibcomponentsjob)
        - [Execution Domain (`src/lib/components/execution/`)](#execution-domain-srclibcomponentsexecution)
        - [Log Domain (`src/lib/components/log/`)](#log-domain-srclibcomponentslog)
  - [4. Service Layer Architecture](#4-service-layer-architecture)
    - [4.1 Service Categories](#41-service-categories)
      - [**API Services** (`src/lib/services/api/`)](#api-services-srclibservicesapi)
      - [**WebSocket Services** (`src/lib/services/websocket/`)](#websocket-services-srclibserviceswebsocket)
      - [**Domain Services** (`src/lib/services/domain/`)](#domain-services-srclibservicesdomain)
    - [4.2 Service Dependencies](#42-service-dependencies)
  - [5. State Management Architecture](#5-state-management-architecture)
    - [5.0 StoresContainer Pattern](#50-storescontainer-pattern)
    - [5.1 Store Factory Pattern Implementation](#51-store-factory-pattern-implementation)
    - [5.2 Store Relationships](#52-store-relationships)
    - [5.3 Store Testing with Dependency Injection](#53-store-testing-with-dependency-injection)
      - [**Testable Store Creation**](#testable-store-creation)
  - [6. Data Flow Architecture](#6-data-flow-architecture)
    - [6.1 Enhanced Component → Store → Service Flow](#61-enhanced-component--store--service-flow)
      - [**Dependency Injection Flow Example**](#dependency-injection-flow-example)
    - [6.2 Real-time Data Flow](#62-real-time-data-flow)
    - [6.3 Example: Command Execution Flow](#63-example-command-execution-flow)
  - [7. Component Communication Patterns](#7-component-communication-patterns)
    - [7.1 Parent-Child Communication](#71-parent-child-communication)
    - [7.2 Store-Mediated Communication](#72-store-mediated-communication)
    - [7.3 Service-Mediated Communication](#73-service-mediated-communication)
  - [8. UI Component System](#8-ui-component-system)
    - [8.1 shadcn-svelte Integration](#81-shadcn-svelte-integration)
    - [8.2 Custom UI Components](#82-custom-ui-components)
    - [8.3 Icon System](#83-icon-system)
  - [9. Error Handling Architecture](#9-error-handling-architecture)
    - [9.1 Store-Level Error Handling](#91-store-level-error-handling)
    - [9.2 Component-Level Error Display](#92-component-level-error-display)
  - [10. Performance Considerations](#10-performance-considerations)
    - [10.1 Reactive Optimization](#101-reactive-optimization)
    - [10.2 Component Lazy Loading](#102-component-lazy-loading)
    - [10.3 WebSocket Connection Management](#103-websocket-connection-management)
  - [11. Testing Architecture](#11-testing-architecture)
    - [11.1 Service Testing](#111-service-testing)
    - [11.2 Store Testing](#112-store-testing)
  - [12. Architecture Strengths](#12-architecture-strengths)
  - [13. Architecture Challenges](#13-architecture-challenges)


---

## 1. Architecture Patterns

### 1.1 Service Container Pattern
**Location**: `src/lib/core/ServiceContainer.js`

```javascript
// Centralized service management with dependency injection
const services = new Map();

export function registerService(name, serviceInstance) {
  services.set(name, serviceInstance);
}

export function getService(name) {
  return services.get(name);
}
```

**Benefits**:
- Dependency injection for testability
- Service lifecycle management
- Loose coupling between components and services

### 1.2 Reactive Store Pattern
**Location**: `src/lib/stores/`

All stores follow a consistent pattern:
```javascript
// Base store with reactive state
class BaseStore {
  constructor() {
    this.state = $state({});
    this.subscribers = new Set();
  }
  
  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.state));
  }
}
```

### 1.3 Component Composition
**Pattern**: Slot-based composition with event delegation

```svelte
<!-- Parent Component -->
<Panel>
  <ComponentA slot="sidebar" />
  <ComponentB slot="main" />
</Panel>
```

---

## 2. Directory Structure Analysis

```
src/lib/
├── components/           # UI Components (View Layer)
│   ├── ui/              # Reusable UI primitives (shadcn-svelte)
│   ├── vm/              # VM domain components
│   ├── command/         # Command domain components
│   ├── job/             # Job domain components
│   ├── log/             # Log domain components
│   └── execution/       # Execution orchestration components
├── stores/              # State Management (Model Layer)
│   ├── vmStore.js       # VM state and operations
│   ├── commandStore.js  # Command templates and execution
│   ├── jobStore.js      # Job tracking and history
│   └── logStore.js      # Log aggregation and display
├── services/            # Business Logic (Service Layer)
│   ├── api/             # HTTP API clients
│   ├── websocket/       # WebSocket clients
│   └── domain/          # Domain-specific services
├── core/                # Infrastructure
│   ├── ServiceContainer.js  # DI container
│   └── config/          # Configuration management
└── utils/               # Shared utilities
```

---

## 3. Component Architecture

### 3.1 Component Hierarchy

```
App.svelte
└── Dashboard.svelte (Main Layout)
    ├── VMManagementPanel.svelte (VM Domain)
    │   ├── VMSidebar.svelte
    │   │   └── VM.svelte (VM Card)
    │   ├── VMForm.svelte (VM CRUD)
    │   └── CommandPanel.svelte (VM Commands)
    │       ├── AddCommandForm.svelte
    │       └── Command.svelte
    └── ExecutionPanel.svelte (Execution Domain)
        ├── ExecutionHeader.svelte
        ├── ExecutionAlert.svelte
        ├── CommandExecutionView.svelte
        ├── Terminal.svelte (Log Display)
        ├── JobHistory.svelte (Job Management)
        │   └── Job.svelte (Job Card)
        └── JobLogModal.svelte (Log Viewer)
```

### 3.2 Component Responsibilities

#### **Layout Components**
- `Dashboard.svelte`: Main application layout and service initialization
- `Panel.svelte`: Reusable panel container with slots
- `Modal.svelte`: Modal dialog wrapper

#### **Domain Components**

##### VM Domain (`src/lib/components/vm/`)
- `VMManagementPanel.svelte`: VM discovery and management orchestration
- `VMSidebar.svelte`: VM list navigation
- `VM.svelte`: Individual VM display and actions
- `VMForm.svelte`: VM creation/editing form

##### Command Domain (`src/lib/components/command/`)
- `CommandPanel.svelte`: Command template management
- `AddCommandForm.svelte`: Command creation form
- `Command.svelte`: Individual command display

##### Job Domain (`src/lib/components/job/`)
- `JobHistory.svelte`: Job list with filtering and pagination
- `Job.svelte`: Individual job status and actions
- `JobLogModal.svelte`: Job log viewer modal

##### Execution Domain (`src/lib/components/execution/`)
- `ExecutionPanel.svelte`: Main execution interface
- `CommandExecutionView.svelte`: Command input and execution
- `Terminal.svelte`: Real-time log display

##### Log Domain (`src/lib/components/log/`)
- `Log.svelte`: Log line rendering
- `LogViewer.svelte`: Historical log viewer

---

## 4. Service Layer Architecture

### 4.1 Service Categories

#### **API Services** (`src/lib/services/api/`)
```javascript
// HTTP API abstraction
class APIService {
  async get(endpoint) { /* ... */ }
  async post(endpoint, data) { /* ... */ }
  // Standard REST operations
}

// Domain-specific API clients
class VMAPIService extends APIService {
  async getVMs() { return this.get('/api/vms'); }
  async createVM(vm) { return this.post('/api/vms', vm); }
}
```

#### **WebSocket Services** (`src/lib/services/websocket/`)
```javascript
// Real-time communication
class JobWebSocketService {
  constructor() {
    this.socket = io('/jobs');
    this.setupEventHandlers();
  }
  
  onJobLog(callback) {
    this.socket.on('job:log', callback);
  }
}
```

#### **Domain Services** (`src/lib/services/domain/`)
```javascript
// Business logic orchestration
class VMService {
  constructor(apiService, wsService) {
    this.api = apiService;
    this.ws = wsService;
  }
  
  async discoverVMs() {
    // Complex business logic
  }
}
```

### 4.2 Service Dependencies

```
VMService
├── VMAPIService (HTTP operations)
├── SSHHostService (SSH config parsing)
└── JobWebSocketService (Real-time updates)

CommandService
├── CommandAPIService (Command templates)
├── CommandExecutor (Execution logic)
└── JobWebSocketService (Execution streaming)

JobService
├── JobAPIService (Job persistence)
├── JobWebSocketService (Real-time updates)
└── LogStore (Log aggregation)
```

---

## 5. State Management Architecture

### 5.0 StoresContainer Pattern
**Location**: `src/lib/stores/StoresContainer.js`

Centralized store management with dependency injection:

```javascript
// Store registration with explicit dependencies
registerStores(serviceContainer);

storesContainer.register('vmStore', async () => {
   const factory = await import('./vmStore.js').then(m => m.createVMStoreFactory);
   return factory({
      vmService: serviceContainer.get('vmService')
   });
});
```

### 5.1 Store Factory Pattern Implementation

```javascript
// Store Factory Template
export function createStoreFactory(storeName, initialState, storeLogic) {
   return function storeFactory(dependencies = {}) {
      const baseStore = createBaseStore(initialState, options, dependencies);
      const storeExtensions = storeLogic(baseStore, dependencies);
      return { ...baseStore, ...storeExtensions };
   };
}
```

**Remove these deprecated patterns:**
- ❌ Direct BaseStore class extension
- ❌ Stores calling `getService()` directly
- ❌ Manual store instantiation examples

### 5.2 Store Relationships

```
vmStore (VM selection)
    ↓
commandStore (VM-specific commands)
    ↓
jobStore (Command execution jobs)
    ↓
logStore (Job execution logs)
```

### 5.3 Store Testing with Dependency Injection

#### **Testable Store Creation**
```javascript
// Easy mocking with dependency injection
const mockVMService = {
   loadVMs: vi.fn().mockResolvedValue([]),
   testConnection: vi.fn().mockResolvedValue({ connected: true })
};

// Create test store with mocked dependencies
const testStore = createVMStoreFactory({ vmService: mockVMService });

// Test store behavior
await testStore.loadVMs();
expect(mockVMService.loadVMs).toHaveBeenCalled();
```

**Testing Benefits**:
- **Isolated Testing**: Test store logic without real services
- **Dependency Mocking**: Easy to mock service responses
- **Predictable Behavior**: Controlled test environment

---

## 6. Data Flow Architecture

### 6.1 Enhanced Component → Store → Service Flow

```
1. Application Bootstrap
   ↓
2. ServiceContainer.initialize()
   ↓  
3. StoresContainer.register() with dependencies
   ↓
4. Component requests store
   ↓
5. Store factory creates instance with injected services
   ↓
6. Store methods use injected dependencies
   ↓
7. Service operations execute
   ↓
8. Store state updates
   ↓
9. Component reactivity triggers re-render
```

#### **Dependency Injection Flow Example**

```javascript
// 1. Registration (in bootstrap)
storesContainer.register('vmStore', () => 
   createVMStoreFactory({ 
      vmService: serviceContainer.get('vmService') 
   })
);

// 2. Component usage (unchanged)
let vms = $derived($vmStore.vms);

// 3. Store operation (with injected service)
async loadVMs() {
   const vmService = this.getDependency('vmService');  // Injected
   const vms = await vmService.loadVMs();
   this.setState({ vms });
}
```

### 6.2 Real-time Data Flow

```
WebSocket Event
    ↓
Service Event Handler
    ↓
Store State Update
    ↓
Component Reactive Update
    ↓
UI Re-render
```

### 6.3 Example: Command Execution Flow

```javascript
// 1. Component triggers execution
<CommandExecutionView oncommandexecute={handleExecute} />

// 2. Store action
commandStore.executeCommand(vmId, command)

// 3. Service orchestration
commandService.execute(vmId, command)
  → jobService.createJob()
  → commandExecutor.execute()
  → webSocketService.streamLogs()

// 4. Real-time updates
jobWebSocketService.onJobLog((data) => {
  logStore.addLogLine(data.jobId, data.chunk);
  jobStore.updateJobStatus(data.jobId, 'running');
});

// 5. Component reactivity
let logLines = $derived(logStore.getLogLinesForJob(currentJobId));
```

---

## 7. Component Communication Patterns

### 7.1 Parent-Child Communication
```svelte
<!-- Parent passes props down -->
<VMSidebar 
  {vms} 
  {selectedVM}
  onvmselect={handleVMSelect}
/>

<!-- Child emits events up -->
<script>
  let { onvmselect } = $props();
  
  function handleSelect(vm) {
    onvmselect?.(vm);
  }
</script>
```

### 7.2 Store-Mediated Communication
```javascript
// Components communicate through shared stores
// Component A
vmStore.selectVM(vm);

// Component B (reactive to store changes)
let selectedVM = $derived(vmStore.selectedVM);
```

### 7.3 Service-Mediated Communication
```javascript
// Components use services for complex operations
const vmService = getService('vmService');
await vmService.executeCommand(vmId, command);
```

---

## 8. UI Component System

### 8.1 shadcn-svelte Integration
**Location**: `src/lib/components/ui/`

```javascript
// Consistent design system
import { Button } from '$lib/components/ui/button';
import { Card } from '$lib/components/ui/card';
import { Alert } from '$lib/components/ui/alert';
```

### 8.2 Custom UI Components
```javascript
// Application-specific UI components
import Panel from '$lib/components/ui/Panel.svelte';
import Modal from '$lib/components/ui/Modal.svelte';
import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
```

### 8.3 Icon System
```javascript
// Lucide icons for consistency
import { Server, Play, Settings, AlertCircle } from 'lucide-svelte';
```

---

## 9. Error Handling Architecture

### 9.1 Store-Level Error Handling
```javascript
class BaseStore {
  async performAction(action) {
    try {
      this.setLoading(true);
      this.setError(null);
      await action();
    } catch (error) {
      this.setError(error.message);
    } finally {
      this.setLoading(false);
    }
  }
}
```

### 9.2 Component-Level Error Display
```svelte
{#if error}
  <Alert variant="destructive">
    <AlertCircle class="h-4 w-4" />
    <AlertDescription>{error}</AlertDescription>
  </Alert>
{/if}
```

---

## 10. Performance Considerations

### 10.1 Reactive Optimization
```javascript
// Derived stores for computed values
let filteredJobs = $derived(
  jobs.filter(job => job.status === selectedStatus)
);
```

### 10.2 Component Lazy Loading
```javascript
// Dynamic imports for large components
const JobLogModal = lazy(() => import('./JobLogModal.svelte'));
```

### 10.3 WebSocket Connection Management
```javascript
// Connection pooling and cleanup
class WebSocketManager {
  constructor() {
    this.connections = new Map();
  }
  
  getConnection(namespace) {
    if (!this.connections.has(namespace)) {
      this.connections.set(namespace, io(namespace));
    }
    return this.connections.get(namespace);
  }
}
```

---

## 11. Testing Architecture

### 11.1 Service Testing
```javascript
// Mock services for component testing
const mockVMService = {
  getVMs: vi.fn().mockResolvedValue([]),
  createVM: vi.fn()
};
```

### 11.2 Store Testing
```javascript
// Store unit testing
describe('VMStore', () => {
  it('should load VMs', async () => {
    const store = new VMStore();
    await store.loadVMs();
    expect(store.vms).toHaveLength(0);
  });
});
```

---

## 12. Architecture Strengths

1. **Separation of Concerns**: Clear boundaries between UI, state, and business logic
2. **Reactive Architecture**: Svelte 5 runes provide efficient reactivity
3. **Service Orientation**: Testable and maintainable service layer
4. **Component Composition**: Reusable and flexible component design
5. **Type Safety**: Consistent prop and event patterns
6. **Real-time Capabilities**: WebSocket integration for live updates

## 13. Architecture Challenges

1. **Store Complexity**: Multiple stores with complex relationships
2. **WebSocket Management**: Connection lifecycle and error handling
3. **State Synchronization**: Keeping UI in sync with real-time updates
4. **Error Propagation**: Consistent error handling across layers
5. **Performance**: Managing large log streams and job histories

---

This architecture provides a solid foundation for the VM Orchestrator's complex requirements while maintaining maintainability and extensibility.

[back to top](#vm-orchestrator-frontend-architecture)
