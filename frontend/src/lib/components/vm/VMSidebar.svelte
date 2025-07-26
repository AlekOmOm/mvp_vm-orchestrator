<!--
  VM Sidebar Component
  
  Displays a list of VMs in a sidebar format with selection and management capabilities.
  Provides a clean, reusable interface for VM navigation.
-->

<script>
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Loader2, Settings, AlertCircle } from 'lucide-svelte';

  export let vms = [];
  export let selectedVM = null;
  export let loading = false;
  export let error = null;

  const dispatch = createEventDispatcher();

  function handleVMSelect(vm) {
    dispatch('vm-select', vm);
  }

  function handleVMEdit(vm) {
    dispatch('vm-edit', vm);
  }
</script>

<aside class="w-64 bg-white border-r border-gray-200 overflow-y-auto">
  <!-- VM List -->
  <div class="p-4">
    <h3 class="text-sm font-medium text-gray-900 mb-3">Virtual Machines</h3>
    
    {#if loading}
      <div class="flex items-center justify-center py-4">
        <Loader2 class="w-4 h-4 animate-spin" />
      </div>
    {:else if vms.length === 0}
      <p class="text-sm text-gray-500">No VMs configured</p>
    {:else}
      <div class="space-y-2">
        {#each vms as vm}
          <div class="p-2 rounded border {selectedVM?.id === vm.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}">
            <div class="flex items-center justify-between">
              <button 
                class="flex-1 text-left"
                on:click={() => handleVMSelect(vm)}
              >
                <div class="font-medium text-sm">{vm.name}</div>
                <div class="text-xs text-gray-500">{vm.host}</div>
              </button>
              
              <div class="flex space-x-1">
                <Button variant="ghost" size="sm" on:click={() => handleVMEdit(vm)}>
                  <Settings class="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if error}
      <Alert variant="destructive" class="mt-4">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    {/if}
  </div>
</aside>
