<script>
  import { getService } from '../../../core/ServiceContainer.js';
  import { storesContainer } from '../../../stores/StoresContainer.js';
  import { derived } from 'svelte/store';
  import CommandGrid from './CommandGrid.svelte';
  import AddCommandForm from '../../command/AddCommandForm.svelte';
  import EditCommandModal from '../EditCommandModal.svelte';
  import DeleteConfirmModal from '../DeleteConfirmModal.svelte';
  import { Button } from '$lib/components/ui/button';
  import { onMount } from 'svelte';
  import { createVMDerivedStores } from '../../../stores/vmStore.js';

  let { oncommandexecute, onalert } = $props();

  let commandStore;
  let vmStore;
  let selectedVMStore;

  onMount(async () => {
    commandStore = await storesContainer.get('commandStore');
    vmStore = await storesContainer.get('vmStore');
    await vmStore.loadVMs();
    const { selectedVM } = createVMDerivedStores(vmStore);
    selectedVMStore = selectedVM;
  });

  const commandExecutor = getService('commandExecutor');
  const jobService = getService('jobService');

  $effect(() => {
    if ($selectedVMStore?.id) {
      console.log('load commands for', $selectedVMStore.id);
      commandStore.loadVMCommands($selectedVMStore.id);
    }
  });

  const commandsStore = derived([commandStore, selectedVMStore], ([$cs, $vm]) => {
    if (!$vm) return [];
    return $cs.commandsByVM[$vm.id] || [];
  });
  let commands = $derived($commandsStore);
  const isExecutingStore = commandExecutor.getIsExecuting();
  let isExecuting = $derived($isExecutingStore);

  const connectionStatusStore = jobService.getConnectionStatus();
  let connectionStatus = $derived($connectionStatusStore);

  let showAddForm = $state(false);
  let editingCommand = $state(null);
  let deletingCommand = $state(null);

  async function handleExecute(cmd) {
    if (connectionStatus !== 'connected') {
      onalert?.({ type: 'error', message: 'WebSocket not connected', domain: 'connection' });
      return;
    }
    if (isExecuting) {
      onalert?.({ type: 'warning', message: 'Another command is already executing', domain: 'execution' });
      return;
    }
    try {
      await commandExecutor.executeCommand($selectedVMStore, cmd);
      oncommandexecute?.(cmd);
    } catch (e) {
      onalert?.({ type: 'error', message: e.message, domain: 'command-execution' });
    }
  }

  function handleEdit(c) { editingCommand = c; }
  function handleDelete(c) { deletingCommand = c; }

  async function handleCommandCreated() {
    showAddForm = false;
    if ($selectedVMStore) {
      commandStore.loadVMCommands($selectedVMStore.id);
    }
  }

  async function handleUpdateCommand(updated) {
    await commandStore.updateCommand(editingCommand.id, updated);
    editingCommand = null;
    if ($selectedVMStore) commandStore.loadVMCommands($selectedVMStore.id);
  }

  async function confirmDeleteCommand() {
    await commandStore.deleteCommand(deletingCommand.id);
    deletingCommand = null;
    if ($selectedVMStore) commandStore.loadVMCommands($selectedVMStore.id);
  }
</script>

<div class="border-b">
  <div class="p-2 text-xs text-muted-foreground bg-muted border-b">
    VM: {$selectedVMStore?.name || 'None'} | Alias: {$selectedVMStore?.alias || 'None'} | Commands: {commands.length} | Status: {connectionStatus}
  </div>

  {#if $selectedVMStore && commands.length > 0}
    <div class="p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">VM Commands</h3>
        <Button size="sm" onclick={() => showAddForm = true}>Add Command</Button>
      </div>
      <CommandGrid {commands} isExecuting={isExecuting} onexecute={handleExecute} onedit={handleEdit} ondelete={handleDelete} />
    </div>
  {:else if commands.length === 0 && $selectedVMStore}
    <div class="p-8 text-center text-muted-foreground">
      <Button size="sm" onclick={() => showAddForm = true} class="mt-2">Add First Command</Button>
    </div>
  {:else}
    <div class="p-8 text-center text-muted-foreground">Select a VM to view commands</div>
  {/if}
</div>

<AddCommandForm isOpen={showAddForm} onclose={() => showAddForm = false} oncommandcreated={handleCommandCreated} />
<EditCommandModal command={editingCommand} onSave={handleUpdateCommand} onCancel={() => editingCommand = null} />
<DeleteConfirmModal command={deletingCommand} onConfirm={confirmDeleteCommand} onCancel={() => deletingCommand = null} /> 
