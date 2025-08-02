<script>
  import { getService } from '$lib/core/ServiceContainer.js';
  import { getSelectedVM, getSelectedVMCommands } from '$lib/state/ui.state.svelte.js';
  import { getCommandStore } from '$lib/state/stores.state.svelte.js';
  import VMCommands from '$lib/components/lib/models/command/VMCommands.svelte';
  import AddCommandForm from '$lib/components/lib/models/command/crud/AddCommandForm.svelte';
  import EditCommandModal from '$lib/components/lib/models/command/crud/EditCommandModal.svelte';
  import DeleteConfirmModal from '$lib/components/lib/models/command/crud/DeleteConfirmModal.svelte';
  import { Button } from '$lib/components/lib/ui/button';
  import Terminal from '$lib/components/subpanels/execution/subExecutionTab/Terminal.svelte'

  let { oncommandexecute, onalert } = $props();

  // Direct state access
  const selectedVM = $derived(getSelectedVM());
  const commands = $derived(getSelectedVMCommands());
  const commandStore = $derived(getCommandStore());

  const commandExecutor = getService('commandExecutor');
  const jobService = getService('jobService');

  const isExecutingStore = commandExecutor.getIsExecuting();
  const isExecuting = $derived($isExecutingStore);

  const connectionStatusStore = jobService.getConnectionStatus();
  const connectionStatus = $derived($connectionStatusStore);

  // Local UI state
  let showAddForm = $state(false);
  let editingCommand = $state(null);
  let deletingCommand = $state(null);

  // ---------------------------
  // event handlers
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
      await commandExecutor.executeCommand(selectedVM, cmd);
      oncommandexecute?.(cmd);
    } catch (e) {
      onalert?.({ type: 'error', message: e.message, domain: 'command-execution' });
    }
  }

  function handleEdit(c) { editingCommand = c; }
  function handleDelete(c) { deletingCommand = c; }

  async function handleUpdateCommand(updated) {
    await commandStore.updateCommand(editingCommand.id, updated);
    editingCommand = null;
    if (selectedVM) commandStore.loadVMCommands(selectedVM.id);
  }

  async function confirmDeleteCommand() {
    await commandStore.deleteCommand(deletingCommand.id);
    deletingCommand = null;
    if (selectedVM) commandStore.loadVMCommands(selectedVM.id);
  }
</script>

<div class="flex flex-col h-full">
  <div class="border-b flex-none min-h-[40vh]">
    {#if !selectedVM}
      <div class="p-8 text-center text-muted-foreground">
        <h3 class="text-lg font-medium mb-2">Select a VM</h3>
        <p>Choose a virtual machine from the sidebar to view and manage commands.</p>
      </div>
    {:else if commands.length > 0}
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">VM Commands</h3>
          <Button size="sm" onclick={() => showAddForm = true}>Add Command</Button>
        </div>
        <VMCommands/>
      </div>
    {:else}
      <div class="p-8 text-center space-y-4">
        <div class="text-muted-foreground">
          <h3 class="text-lg font-medium mb-2">No Commands Configured</h3>
          <p>No commands have been set up for <strong>{selectedVM.name}</strong>.</p>
        </div>
        <Button onclick={() => showAddForm = true}>Add First Command</Button>
      </div>
    {/if}
  </div>

    <Terminal class="flex-1" />
</div>
<AddCommandForm bind:isOpen={showAddForm} onclose={() => showAddForm = false} />
