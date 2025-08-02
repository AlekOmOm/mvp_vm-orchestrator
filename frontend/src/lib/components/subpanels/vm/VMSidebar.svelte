<!--
  VM Sidebar - Pure UI Component
-->

<script>
  import VM from '$lib/components/lib/models/vm/VM.svelte';
  import { getVMStore } from '$lib/state/stores.state.svelte.js';
  import { getSelectedVM } from '$lib/state/ui.state.svelte.js';

  const vmStore = $derived(getVMStore());
  const vms = $derived(vmStore?.vms || null);
  const selectedVM = $derived(getSelectedVM());

  let sortedVMs = $state([]);
 
  function computeSortedVMs() {
    if (!vms || !Array.isArray(vms)) return []
    if (!selectedVM) return [...vms]

    const first = vms.find((vm) => vm.id === selectedVM.id)
    if (!first) return [...vms]
    
    return [first, ...vms.filter((vm) => vm.id !== selectedVM.id)]
  }

  $effect(() => {
    sortedVMs = computeSortedVMs()
  }) 

</script>

<aside class="w-full h-full bg-background border-r border-border overflow-y-auto">
  <div class="p-2">
    {#if !vms}
      <div class="text-center py-4">
        <p class="text-xs text-muted-foreground">Loading VMs...</p>
      </div>
    {:else if vms.length === 0}
      <div class="text-center py-4">
        <p class="text-xs text-muted-foreground">No VMs configured</p>
      </div>
    {:else}
      <div class="space-y-1">
        {#if sortedVMs.length === 0}
          {#each vms as vm (vm.id) }
            <VM {vm} />
          {/each}
        {:else}
          {#each sortedVMs as vm (vm.id)}
            <VM {vm} />
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</aside>
