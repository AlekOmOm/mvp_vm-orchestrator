<script>
  import { getService } from '../../../core/ServiceContainer.js';
  import { selectedVM } from '../../../stores/vmStore.js';
  import { currentVMCommands, commandStore } from '../../../stores/commandStore.js';
  import CommandGrid from './CommandGrid.svelte';
  import AddCommandForm from '../../command/AddCommandForm.svelte';
  import EditCommandModal from '../EditCommandModal.svelte';
  import DeleteConfirmModal from '../DeleteConfirmModal.svelte';
  import { Button } from '$lib/components/ui/button';

  let { oncommandexecute, onalert } = $props();

  const commandExecutor = getService('commandExecutor');
  const jobService = getService('jobService');

  $effect(() => {
    if ($selectedVM?.id) {
      console.log('load commands for', $selectedVM.id);
      commandStore.loadVMCommands($selectedVM.id);
    }
  });

  let commands = $derived($currentVMCommands || []);
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
      await commandExecutor.executeCommand($selectedVM, cmd);
      oncommandexecute?.(cmd);
    } catch (e) {
      onalert?.({ type: 'error', message: e.message, domain: 'command-execution' });
    }
  }

  function handleEdit(c) { editingCommand = c; }
  function handleDelete(c) { deletingCommand = c; }

  async function handleCommandCreated() {
    showAddForm = false;
    if ($selectedVM) {
      commandStore.loadVMCommands($selectedVM.id);
    }
  }

  async function handleUpdateCommand(updated) {
    await commandStore.updateCommand(editingCommand.id, updated);
    editingCommand = null;
    if ($selectedVM) commandStore.loadVMCommands($selectedVM.id);
  }

  async function confirmDeleteCommand() {
    await commandStore.deleteCommand(deletingCommand.id);
    deletingCommand = null;
    if ($selectedVM) commandStore.loadVMCommands($selectedVM.id);
  }
</script>

<div class="border-b">
  <div class="p-2 text-xs text-muted-foreground bg-muted border-b">
    VM: {$selectedVM?.name || 'None'} | Alias: {$selectedVM?.alias || 'None'} | Commands: {commands.length} | Status: {connectionStatus}
  </div>

  {#if $selectedVM && commands.length > 0}
    <div class="p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">VM Commands</h3>
        <Button size="sm" onclick={() => showAddForm = true}>Add Command</Button>
      </div>
      <CommandGrid {commands} isExecuting={isExecuting} onexecute={handleExecute} onedit={handleEdit} ondelete={handleDelete} />
    </div>
  {:else if commands.length === 0 && $selectedVM}
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
