# Standardized Store Patterns

This document outlines the standardized patterns for store-service integration in the VM Orchestrator frontend application.

## Overview

The application uses a consistent factory pattern for all stores with dependency injection through the ServiceContainer and StoresContainer. This ensures clean separation of concerns, testability, and maintainable code.

## Architecture Components

### 1. Store Factory Pattern

All stores use the factory pattern exclusively. **No singleton exports are allowed.**

```javascript
// ✅ CORRECT: Factory pattern only
export const createVMStoreFactory = createStoreFactory('VMStore', initialState, vmStoreLogic);

// ❌ INCORRECT: Singleton exports (removed)
// export const vmStore = createVMStore();
```

### 2. Store Registration

Stores are registered with the StoresContainer using dependency injection:

```javascript
// storeRegistry.js
registerStoreWithDependencies(
  'vmStore',
  () => import('./vmStore.js').then(m => m.createVMStoreFactory),
  ['vmService'] // Dependencies injected automatically
);
```

### 3. Component Store Access Pattern

Components should access stores through the StoresContainer using this standardized pattern:

```javascript
// ✅ CORRECT: Direct store access via StoresContainer
import { onMount } from 'svelte';
import { storesContainer } from '../../stores/StoresContainer.js';

let vmStore;
let vms = $state([]);
let selectedVM = $state(null);
let loading = $state(false);
let error = $state(null);

onMount(async () => {
  try {
    vmStore = await storesContainer.get('vmStore');

    $effect(() => {
      if (vmStore) {
        const state = vmStore.getValue();
        vms = state.vms;
        selectedVM = state.selectedVM;
        loading = state.loading;
        error = state.error;
      }
    });

    await vmStore.loadVMs();
  } catch (error) {
    console.error('Failed to initialize VM store:', error);
  }
});
```

## Store Access Methods

All stores provide these common methods:

- `getValue()` - Get current store state
- `subscribe(callback)` - Subscribe to state changes
- Store-specific methods (e.g., `loadVMs()`, `selectVM()`, `createCommand()`)

## Available Stores

### VM Store (`vmStore`)
- **State**: `vms`, `selectedVM`, `loading`, `error`
- **Methods**: `loadVMs()`, `selectVM(vm)`, `editVM(vm)`, `deleteVM(vm)`, `clearError()`

### Command Store (`commandStore`)
- **State**: `vmCommands`, `commandsByVM`, `availableTemplates`, `loading`, `error`
- **Methods**: `loadVMCommands(vmId)`, `loadAvailableTemplates()`, `createCommand(vmId, data)`, `updateCommand(id, updates)`, `deleteCommand(id)`, `clearError()`

### Job Store (`jobStore`)
- **State**: `jobs`, `jobsByVM`, `currentJob`, `loading`, `error`, `stats`
- **Methods**: `loadJobs()`, `loadVMJobs(vmId)`, `setCurrentJob(job)`, `addJob(job)`, `updateJob(id, updates)`, `removeJob(id)`, `clearJobs()`, `clearError()`

### Log Store (`logStore`)
- **State**: `linesByJob`
- **Methods**: `getLogLinesForJob(jobId)`, `addLogLine(jobId, line)`, `setLogsForJob(jobId, logs)`

## Component Integration Examples

### Simple Component

```svelte
<script>
  import { onMount } from 'svelte';
  import { storesContainer } from '../../stores/StoresContainer.js';

  let vmStore;
  let vms = $state([]);
  let selectedVM = $state(null);

  onMount(async () => {
    vmStore = await storesContainer.get('vmStore');

    $effect(() => {
      if (vmStore) {
        const state = vmStore.getValue();
        vms = state.vms;
        selectedVM = state.selectedVM;
      }
    });
  });

  function selectVM(vm) {
    vmStore?.selectVM(vm);
  }
</script>

{#each vms as vm}
  <button onclick={() => selectVM(vm)}>
    {vm.name}
  </button>
{/each}
```

### Complex Component (Multiple Stores)

```svelte
<script>
  import { onMount } from 'svelte';
  import { storesContainer } from '../../stores/StoresContainer.js';

  let vmStore;
  let commandStore;
  let selectedVM = $state(null);
  let availableTemplatesArray = $state([]);

  onMount(async () => {
    try {
      vmStore = await storesContainer.get('vmStore');
      commandStore = await storesContainer.get('commandStore');

      $effect(() => {
        if (vmStore) {
          const state = vmStore.getValue();
          selectedVM = state.selectedVM;
        }
        if (commandStore) {
          const state = commandStore.getValue();
          availableTemplatesArray = Object.entries(state.availableTemplates).map(([key, config]) => ({
            id: key,
            name: key,
            ...config
          }));
        }
      });

      await vmStore.loadVMs();
      await commandStore.loadAvailableTemplates();
    } catch (error) {
      console.error('Failed to initialize stores:', error);
    }
  });

  async function handleCreateCommand(commandData) {
    if (!selectedVM) return;
    await commandStore.createCommand(selectedVM.id, commandData);
  }
</script>
```

## Benefits

1. **Reduced Boilerplate**: No more manual `onMount` and `$effect` code
2. **Consistent Patterns**: All components use the same store access pattern
3. **Better Performance**: Composables handle optimization automatically
4. **Easier Testing**: Composables can be easily mocked
5. **Type Safety**: Better IntelliSense and error detection
6. **Maintainability**: Centralized store logic in composables

## Best Practices

1. **Only destructure what you need** from composables
2. **Use descriptive variable names** when renaming destructured properties
3. **Prefer composables over direct store access** in components
4. **Keep store logic in stores**, not in composables
5. **Use the `store` property** only when you need advanced store methods not exposed by the composable

## Troubleshooting

### Common Issues

1. **"Store not found" errors**: Ensure the store is registered in `storeRegistry.js`
2. **Reactivity not working**: Make sure you're using the composable values directly, not storing them in local state
3. **Methods not available**: Check that the method is exposed by the composable

### Debug Tips

1. Use the `store` property from composables to access the raw store for debugging
2. Check the browser console for store initialization errors
3. Verify that services are properly registered in the ServiceContainer
