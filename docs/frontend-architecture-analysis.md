# VM Orchestrator Frontend Architecture Analysis

## Current Architecture Assessment

### Strengths
1. **Modular Component Structure**: Good separation between VM management and execution panels
2. **Service Layer**: Well-defined API and WebSocket services
3. **Store Pattern**: Consistent state management using base store pattern
4. **Svelte 5 Migration**: Already using modern runes syntax ($props, $state, $derived)
5. **UI Component Library**: shadcn-svelte integration for consistent design

### Current Component Hierarchy
```
App.svelte
└── Dashboard.svelte
    ├── VMManagementPanel.svelte
    │   └── VMSidebar.svelte
    │       └── VM.svelte
    └── ExecutionPanel.svelte
        ├── LogViewer.svelte
        └── JobHistory.svelte
            └── Job.svelte
```

### Issues Identified

#### 1. **Tight Coupling**
- Dashboard component handles too many responsibilities
- Direct WebSocket service instantiation in Dashboard
- Mixed concerns between UI and business logic

#### 2. **Limited Scalability**
- Monolithic panel approach doesn't scale well
- Hard to add new features without modifying core components
- No clear routing or navigation structure

#### 3. **State Management Complexity**
- Multiple stores with overlapping concerns
- Event propagation through component hierarchy
- Difficult to track data flow

#### 4. **Missing Core Features**
Based on API spec and user stories, missing:
- Command templates and suggestions
- Job management and controls
- Log filtering and export
- VM status monitoring
- Real-time connection status

## Recommended Architecture Improvements

### 1. **Feature-Based Module Organization**

```
src/lib/
├── modules/
│   ├── vm/
│   │   ├── components/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   ├── command/
│   ├── job/
│   └── log/
├── shared/
│   ├── components/
│   ├── services/
│   ├── stores/
│   └── utils/
└── core/
    ├── layout/
    ├── routing/
    └── config/
```

### 2. **Component Composition Pattern**

Instead of large monolithic panels, use smaller composable components:

```svelte
<!-- VM Module Example -->
<VMModule>
  <VMList slot="list" />
  <VMDetails slot="details" />
  <VMActions slot="actions" />
</VMModule>
```

### 3. **Service Layer Improvements**

#### Current Issues:
- WebSocket service mixed with API service
- No clear separation of concerns
- Hard to test and mock

#### Recommended:
```javascript
// Separate concerns
class APIClient {
  // HTTP requests only
}

class WebSocketClient {
  // Real-time communication only
}

class VMService {
  // VM-specific business logic
  constructor(apiClient, wsClient) {}
}
```

### 4. **State Management Refactoring**

#### Current Store Issues:
- Stores directly call API services
- Mixed UI and business state
- Complex event handling

#### Recommended Pattern:
```javascript
// Pure state management
const vmStore = createStore({
  vms: [],
  selectedVM: null,
  loading: false,
  error: null
});

// Service handles business logic
class VMService {
  async loadVMs() {
    vmStore.setLoading(true);
    try {
      const vms = await this.apiClient.getVMs();
      vmStore.setVMs(vms);
    } catch (error) {
      vmStore.setError(error);
    } finally {
      vmStore.setLoading(false);
    }
  }
}
```

## Implementation Priority

### Phase 1: Core Infrastructure (High Priority)
1. **Modular Service Layer**
   - Separate API and WebSocket clients
   - Create feature-specific services
   - Implement proper error handling

2. **Component Refactoring**
   - Break down large components
   - Implement composition patterns
   - Add proper prop validation

### Phase 2: Feature Modules (Medium Priority)
1. **VM Module Enhancement**
   - Real-time status monitoring
   - Connection testing
   - SSH configuration display

2. **Command Module**
   - Template system integration
   - Command builder UI
   - Execution history

3. **Job Module**
   - Job queue management
   - Progress tracking
   - Cancellation controls

### Phase 3: Advanced Features (Low Priority)
1. **Log Module**
   - Advanced filtering
   - Export functionality
   - Log aggregation

2. **Dashboard Enhancements**
   - Customizable layouts
   - Widget system
   - User preferences

## Backend Integration Analysis

### Available API Endpoints
- ✅ VM CRUD operations
- ✅ Command management
- ✅ Job history
- ✅ SSH host discovery
- ✅ WebSocket job events

### Missing Frontend Implementation
- Command templates (`/api/commands`)
- VM job caching (`/api/vms/{vmId}/jobs`)
- SSH connection testing
- Real-time VM status updates

## Implementation Plan

### Step 1: Core Service Layer Refactoring

#### 1.1 Create Base Communication Clients
```javascript
// src/lib/core/clients/ApiClient.js
class ApiClient {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.timeout = options.timeout || 30000;
  }

  async request(endpoint, options = {}) {
    // Pure HTTP client implementation
  }
}

// src/lib/core/clients/WebSocketClient.js
class WebSocketClient {
  constructor(namespace, options = {}) {
    this.namespace = namespace;
    this.socket = null;
    this.eventHandlers = new Map();
  }

  connect() {
    // Pure WebSocket connection management
  }
}
```

#### 1.2 Feature-Specific Services
```javascript
// src/lib/modules/vm/services/VMService.js
class VMService {
  constructor(apiClient, wsClient) {
    this.api = apiClient;
    this.ws = wsClient;
  }

  async loadVMs() {
    // VM-specific business logic
  }

  async testConnection(vmId) {
    // SSH connection testing
  }
}
```

### Step 2: Component Architecture Improvements

#### 2.1 Dashboard Refactoring
- Extract service initialization to App.svelte
- Create layout components (Header, Sidebar, MainContent)
- Implement proper dependency injection

#### 2.2 Feature Module Structure
```
src/lib/modules/
├── vm/
│   ├── components/
│   │   ├── VMList.svelte
│   │   ├── VMCard.svelte
│   │   ├── VMDetails.svelte
│   │   └── VMActions.svelte
│   ├── services/
│   │   └── VMService.js
│   ├── stores/
│   │   └── vmStore.js
│   └── index.js
├── command/
├── job/
└── log/
```

### Step 3: Missing API Feature Implementation

#### 3.1 Command Templates
- Implement `/api/commands` endpoint integration
- Create command suggestion system
- Add command builder UI

#### 3.2 Job Management
- Add job queue visualization
- Implement job cancellation
- Create job retry functionality

#### 3.3 Real-time Features
- VM status monitoring
- Live log streaming improvements
- Connection status indicators

## Next Steps

1. **Immediate Actions**
   - Create new service layer structure
   - Refactor Dashboard component
   - Implement dependency injection

2. **Short-term Goals**
   - Migrate to feature-based modules
   - Add missing API integrations
   - Improve error handling

3. **Long-term Vision**
   - Plugin architecture for extensibility
   - Advanced monitoring capabilities
   - Multi-tenant support preparation

## Technical Debt Assessment

### High Priority
- Dashboard component complexity ⚠️
- Mixed service responsibilities ⚠️
- Inconsistent error handling ⚠️

### Medium Priority
- Component prop drilling
- Store coupling issues
- Missing TypeScript definitions

### Low Priority
- CSS organization
- Component documentation
- Test coverage gaps
