<!--
  VM Sidebar - Pure UI Component
-->

<script>
  import { Button } from '$lib/components/ui/button';
  import VM from './VM.svelte';
  import { getVMStore } from '$lib/state/stores.state.svelte.js';
  import { getSelectedVM, selectVM } from '$lib/state/ui.state.svelte.js';

  const vmStore = getVMStore();
  const selectedVM = $derived(getSelectedVM());

  let { onvmedit, onvmmanagecommands } = $props();

  // Direct reactive consumption
  let vms = $state([]);
  let loading = $state(false);
  let error = $state(null);

  $effect(() => {
    const unsubscribe = vmStore.subscribe(state => {
      vms = state.vms;
      loading = state.loading;
      error = state.error;
    });
    return unsubscribe;
  });

  function handleVMSelect(vm) {
    selectVM(vm.id);
  }
</script>

<aside class="w-full h-full bg-background border-r border-border overflow-y-auto">
  <div class="p-2">
    {#if loading}
      <div class="flex items-center justify-center py-4">
        Loading VMs...
      </div>
    {:else if vms.length === 0}
      <div class="text-center py-4">
        <p class="text-xs text-muted-foreground">No VMs configured</p>
      </div>
    {:else}
      <div class="space-y-1">
        {#each vms as vm}
          <VM
            {vm}
            isSelected={selectedVM?.id === vm.id}
            onselect={handleVMSelect}
            onedit={onvmedit}
            onmanagecommands={onvmmanagecommands}
          />
        {/each}
      </div>
    {/if}
  </div>
</aside>
