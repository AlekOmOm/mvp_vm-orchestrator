# Svelte State Management Patterns

## The Problem You Identified

You correctly identified that shared state like `selectedVM` creates architectural challenges:

1. **VMSidebar** needs to update the selected VM
2. **ExecutionPanel** needs to react to VM selection changes  
3. **Parent components** shouldn't need to manage all child state

## Two Valid Svelte Patterns

### Pattern 1: Centralized Store (Recommended for Global State)

**When to use**: State that multiple unrelated components need (like selectedVM)

```javascript
// uiState.js - Centralized store
export const uiState = writable({ selectedVMId: null });

// VMSidebar.svelte - Updates store directly
import { uiState } from './stores/uiState.js';

function handleVMSelect(vm) {
  uiState.selectVM(vm.id); // Update centralized state
  onvmselect?.(vm); // Optional parent callback
}

// ExecutionPanel.svelte - Subscribes to store directly  
import { uiState } from './stores/uiState.js';

$effect(() => {
  const unsubscribe = uiState.subscribe(state => {
    selectedVMId = state.selectedVMId;
    // React to changes...
  });
  return unsubscribe;
});
```

**Benefits**:
- ✅ No prop drilling
- ✅ Components stay in sync automatically
- ✅ Parent doesn't manage child state
- ✅ Easy to add new components that need the state

### Pattern 2: Parent Coordination (For Related Components)

**When to use**: State that only affects a specific component tree

```javascript
// Dashboard.svelte - Parent manages shared state
let selectedVMId = $state(null);

function handleVMSelect(vm) {
  selectedVMId = vm.id;
}

// Pass down to children
<VMSidebar {selectedVMId} onvmselect={handleVMSelect} />
<ExecutionPanel {selectedVMId} />
```

## Your Current Architecture Issues

### ❌ Problem: Mixed Patterns
```javascript
// VMSidebar uses callbacks
onvmselect(vm) // Calls parent

// ExecutionPanel uses vmStore.selectedVM  
selectedVM = $selectedVMStore // Different source of truth

// Result: Components can get out of sync!
```

### ✅ Solution: Consistent Pattern
```javascript
// Both components use same store
import { uiState } from './stores/uiState.js';

// VMSidebar updates store
uiState.selectVM(vm.id);

// ExecutionPanel subscribes to store
uiState.subscribe(state => { ... });
```

## Recommended Architecture

```
Dashboard.svelte (Layout only)
├── VMManagementPanel.svelte (VM CRUD operations)
│   └── VMSidebar.svelte (Updates uiState.selectedVMId)
└── ExecutionPanel.svelte (Subscribes to uiState.selectedVMId)
```

**Key principles**:
1. **uiState** manages selectedVMId globally
2. **Components** subscribe directly to uiState
3. **Parents** handle layout, not state coordination
4. **Stores** handle data, components handle UI

## Implementation Benefits

- **Predictable**: Single source of truth for selectedVM
- **Scalable**: Easy to add new components that need selectedVM
- **Maintainable**: No complex parent-child state passing
- **Performant**: Only components that need the state subscribe

This is the standard Svelte pattern for global UI state!
