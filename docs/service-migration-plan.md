# Service Layer Migration Plan

## Current State Analysis

### Existing Services (`/lib/services/`)
- **ApiService.js** - Base HTTP client + feature services (VMService, CommandService, JobService, SSHHostService)
- **WebSocketService.js** - WebSocket client with business logic mixed in
- **SSHHostService.js** - SSH-specific service extending ApiService

### Issues with Current Architecture
1. **Mixed Concerns**: HTTP client mixed with business logic
2. **Tight Coupling**: Services directly instantiate their dependencies
3. **Hard to Test**: Cannot easily mock dependencies
4. **Code Duplication**: Similar patterns repeated across services

## Migration Strategy

### Phase 1: Extract Pure Clients (CURRENT)
✅ Create `ApiClient.js` - Pure HTTP client
✅ Create `WebSocketClient.js` - Pure WebSocket client

### Phase 2: Refactor Existing Services
Instead of creating new overlapping services, refactor existing ones:

#### 2.1 Refactor ApiService.js
```javascript
// OLD: ApiService.js (monolithic)
export class ApiService { /* HTTP + business logic */ }
export class VMService extends ApiService { /* VM logic */ }
export class CommandService extends ApiService { /* Command logic */ }

// NEW: Separate concerns
// ApiService.js -> ApiClient.js (pure HTTP)
// VMService.js -> business logic only
// CommandService.js -> business logic only
```

#### 2.2 Refactor WebSocketService.js
```javascript
// OLD: WebSocketService.js (connection + business logic)
export class WebSocketService {
  connect() { /* connection logic */ }
  executeCommand() { /* business logic */ }
}

// NEW: Separate concerns
// WebSocketClient.js -> pure connection management
// JobService.js -> job execution business logic
```

#### 2.3 Update SSHHostService.js
```javascript
// OLD: extends ApiService
export class SSHHostService extends ApiService {}

// NEW: uses ApiClient via dependency injection
export class SSHHostService {
  constructor(apiClient) {
    this.api = apiClient;
  }
}
```

### Phase 3: Implement Dependency Injection
Create service container for managing dependencies:

```javascript
// ServiceContainer.js
export class ServiceContainer {
  constructor() {
    this.registerSingleton('apiClient', () => new ApiClient());
    this.registerSingleton('wsClient', () => new WebSocketClient('/jobs'));
    this.registerFactory('vmService', (container) => 
      new VMService(container.get('apiClient'), container.get('wsClient'))
    );
  }
}
```

## Migration Steps

### Step 1: Create Backward-Compatible Wrapper
Create a wrapper that maintains existing API while using new clients:

```javascript
// services/ApiService.js (updated)
import { ApiClient } from '../core/clients/ApiClient.js';

// Maintain backward compatibility
export class ApiService {
  constructor() {
    this.client = new ApiClient();
  }
  
  // Delegate to new client
  async get(endpoint) {
    return this.client.get(endpoint);
  }
  // ... other methods
}

// Keep existing exports working
export class VMService extends ApiService {
  // Existing VM methods work unchanged
}
```

### Step 2: Gradually Migrate Components
Update components one by one to use new service container:

```javascript
// OLD: Direct service instantiation
import { vmService } from '../services/ApiService.js';

// NEW: Dependency injection
import { serviceContainer } from '../core/ServiceContainer.js';
const vmService = serviceContainer.get('vmService');
```

### Step 3: Remove Old Services
Once all components are migrated, remove old service files.

## Benefits of This Approach

### 1. **No Breaking Changes**
- Existing components continue to work
- Gradual migration possible
- Rollback option available

### 2. **Better Architecture**
- Pure clients for communication
- Business services for domain logic
- Dependency injection for flexibility

### 3. **Improved Testing**
- Easy to mock dependencies
- Unit test business logic separately
- Integration test communication separately

### 4. **Future-Proof**
- Easy to add new services
- Plugin architecture possible
- Better error handling

## Implementation Priority

### High Priority (Week 1)
1. ✅ Create ApiClient.js and WebSocketClient.js
2. Create ServiceContainer.js
3. Create backward-compatible wrapper in ApiService.js

### Medium Priority (Week 2)
1. Refactor VMService to use new clients
2. Refactor WebSocketService business logic
3. Update Dashboard to use service container

### Low Priority (Week 3)
1. Migrate all components to service container
2. Remove old service files
3. Add comprehensive error handling

## File Structure After Migration

```
src/lib/
├── core/
│   ├── clients/
│   │   ├── ApiClient.js          # Pure HTTP client
│   │   └── WebSocketClient.js    # Pure WebSocket client
│   └── ServiceContainer.js       # Dependency injection
├── modules/
│   ├── vm/
│   │   └── services/
│   │       └── VMService.js      # VM business logic
│   ├── command/
│   │   └── services/
│   │       └── CommandService.js # Command business logic
│   └── job/
│       └── services/
│           └── JobService.js     # Job business logic
└── services/                     # Legacy (to be removed)
    ├── ApiService.js             # Backward compatibility wrapper
    ├── WebSocketService.js       # Backward compatibility wrapper
    └── SSHHostService.js         # Migrated to use new clients
```

## Next Steps

1. **Complete ServiceContainer.js** implementation
2. **Create backward-compatible wrappers** in existing service files
3. **Update Dashboard component** to use service container
4. **Test migration** with existing functionality
5. **Gradually migrate** other components
