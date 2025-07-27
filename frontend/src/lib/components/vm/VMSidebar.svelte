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
        {#each vms as vm}
          <VM
            vm={vm}
            isSelected={selectedVM?.id === vm.id}
            onselect={onvmselect}
            onedit={onvmedit}
            ondelete={onvmdelete}
            onmanagecommands={onvmmanagecommands}
          />
          
          <!-- <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-sm truncate">{vm.name}</div>
                  <div class="text-xs text-muted-foreground truncate font-mono">
                    {vm.user}@{vm.host}
                  </div>
                  {#if vm.environment}
                    <div class="text-xs text-muted-foreground mt-1 capitalize">
                      {vm.environment}
                    </div>
                  {/if}
                </div>

                <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={(e) => {
                      e.stopPropagation();
                      handleVMEdit(vm);
                    }}
                    class="h-6 w-6 p-0"
                  >
                    <Settings class="w-3 h-3" />
                  </Button>
                </div>
              </div> -->
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
