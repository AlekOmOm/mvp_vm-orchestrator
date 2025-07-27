<!--
  VM Sidebar Component
  
  Displays a list of VMs in a sidebar format with selection and management capabilities.
  Provides a clean, reusable interface for VM navigation.
-->

<script>
  import { Button } from '$lib/components/ui/button';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Loader2, Settings, AlertCircle } from 'lucide-svelte';
  import VM from './VM.svelte';

  // Props using Svelte 5 runes
  let {
    vms = [],
    selectedVM = null,
    loading = false,
    error = null,
    onvmselect = () => {},
    onvmedit = () => {},
    onvmdelete = () => {},
    onvmmanagecommands = () => {}
  } = $props();

  // Sort VMs by most recently selected using localStorage history
  const orderedVMs = $derived.by(() => {
    if (vms.length === 0) return [];

    // Get selection history from localStorage
    let history = [];
    try {
      const stored = localStorage.getItem("vmSelectionHistory");
      history = stored ? JSON.parse(stored) : [];
    } catch (e) {
      history = [];
    }

    // Sort VMs by selection history order
    const sortedVMs = [...vms].sort((a, b) => {
      const aIndex = history.indexOf(a.id);
      const bIndex = history.indexOf(b.id);

      // If both are in history, sort by history order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // If only one is in history, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // If neither is in history, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

    return sortedVMs;
  });

</script>

<aside class="w-full h-full bg-background border-r border-border overflow-y-auto">
  <!-- VM List -->
  <div class="p-2">
    {#if loading}
      <div class="flex items-center justify-center py-4">
        <Loader2 class="w-4 h-4 animate-spin text-muted-foreground" />
        <span class="ml-2 text-xs text-muted-foreground">Loading VMs...</span>
      </div>
    {:else if vms.length === 0}
      <div class="text-center py-4">
        <p class="text-xs text-muted-foreground">No VMs configured</p>
        <p class="text-[10px] text-muted-foreground mt-1">VMs will appear here when discovered</p>
      </div>
    {:else}
      <div class="space-y-1">
        {#each orderedVMs as vm, index}
          <VM
            vm={vm}
            isSelected={selectedVM?.id === vm.id}
            onselect={onvmselect}
            onedit={onvmedit}
            ondelete={onvmdelete}
            onmanagecommands={onvmmanagecommands}
          />

          <!-- Add divider after recently selected VMs (first 3 in history) -->
          {#if index === 2 && orderedVMs.length > 3}
            <div class="border-t border-border my-2 mx-2">
              <div class="text-xs text-muted-foreground text-center py-1">Other VMs</div>
            </div>
          {/if}
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
