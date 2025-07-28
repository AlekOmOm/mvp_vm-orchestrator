<script>
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Terminal, Play, Loader2, Plus } from 'lucide-svelte';
  import { getService } from '$lib/core/ServiceContainer.js';
  import { derived } from 'svelte/store';
  import { storesContainer } from '../../stores/StoresContainer.js';
  import { createVMDerivedStores } from '../../stores/vmStore.js';
  import { onMount } from 'svelte';

  let {
    commands = {},
    vmName = '',
    onexecute = () => {},
    onaddcommand = () => {},
    onadddefaults = () => {}
  } = $props();

  let commandStore;
  let selectedVMStore;

  onMount(async () => {
    commandStore = await storesContainer.get('commandStore');
    const vmStore = await storesContainer.get('vmStore');
    const { selectedVM } = createVMDerivedStores(vmStore);
    selectedVMStore = selectedVM;
  });

  const commandExecutor = getService('commandExecutor');
  const jobService = getService('jobService');

  // ✅ FIX: Load commands when VM changes
  $effect(() => {
    if ($selectedVMStore?.id) {
      console.log('Loading commands for VM:', $selectedVMStore.id);
      commandStore.loadVMCommands($selectedVMStore.id);
    }
  });

  // ✅ FIX: Use store commands instead of props
  const vmCommandsStore = derived([commandStore, selectedVMStore], ([$cs, $vm]) => {
    if (!$vm) return [];
    return $cs.commandsByVM[$vm.id] || [];
  });
  let vmCommands = $derived($vmCommandsStore);
  const isExecutingStore = commandExecutor.getIsExecuting();
  let isExecuting = $derived($isExecutingStore);
  let isConnected = $derived(jobService.isConnected);

  console.log('CommandPanel - VM Commands:', vmCommands);

  async function executeCommand(command) {
    if (isExecuting || !isConnected || !$selectedVMStore) return;

    try {
      await commandExecutor.executeCommand($selectedVMStore, command);
      onexecute({ command, vm: $selectedVMStore });
    } catch (error) {
      console.error('Execution failed:', error);
    }
  }
</script>

<div class="h-full overflow-y-auto p-4 space-y-4">
  {#if !$selectedVMStore}
    <div class="text-center text-muted-foreground py-8">
      Select a VM to view commands
    </div>
  {:else if vmCommands.length === 0}
    <div class="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-4">
      <p>No commands for {$selectedVMStore.name} yet.</p>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" onclick={onaddcommand}>
          <Plus class="w-3 h-3 mr-1" /> Add Command
        </Button>
        <Button variant="outline" size="sm" onclick={onadddefaults}>
          Use Defaults
        </Button>
      </div>
    </div>
  {:else}
    <div class="space-y-3">
      <h3 class="font-semibold">Commands for {$selectedVMStore.name}</h3>
      {#each vmCommands as command}
        <Button
          variant="outline"
          size="sm"
          class="w-full justify-start h-auto p-3"
          disabled={isExecuting}
          onclick={() => executeCommand(command)}
        >
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              {#if isExecuting && jobService.currentJob?.command === command.cmd}
                <Loader2 class="w-4 h-4 animate-spin" />
              {:else}
                <Play class="w-4 h-4" />
              {/if}
              <span class="font-medium">{command.name}</span>
            </div>
            {#if command.description}
              <span class="text-xs text-muted-foreground">{command.description}</span>
            {/if}
          </div>
        </Button>
      {/each}
    </div>
  {/if}
</div>
