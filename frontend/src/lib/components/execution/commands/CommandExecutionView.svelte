<script>
  import { getService } from '../../../core/ServiceContainer.js';
  import { storesContainer } from '../../../stores/StoresContainer.js';
  import { uiState } from '../../../state/ui.state.svelte.js';
  import CommandGrid from './CommandGrid.svelte';
  import AddCommandForm from '../../command/AddCommandForm.svelte';
  import EditCommandModal from '../EditCommandModal.svelte';
  import DeleteConfirmModal from '../DeleteConfirmModal.svelte';
  import { Button } from '$lib/components/ui/button';
  import { onMount } from 'svelte';

  let { oncommandexecute, onalert } = $props();

  let commandStore;
  let vmStore;
  let storesReady = $state(false);

  let selectedVMId = $state(null);
  let selectedVM = $state(null);
  let commands = $state([]);
  let storeState = $state({
    commandsByVM: {},
    vmCommands: [],
    loading: false,
    error: null
  });

  onMount(async () => {
    try {
      commandStore = await storesContainer.get('commandStore');
      vmStore = await storesContainer.get('vmStore');
      storesReady = true;

      // Subscribe to all needed stores
      const unsubscribeUI = uiState.subscribe(state => {
        selectedVMId = state.selectedVMId;
      });

      const unsubscribeVM = vmStore.subscribe(state => {
        if (selectedVMId) {
          selectedVM = state.vms.find(vm => vm.id === selectedVMId);
        } else {
          selectedVM = null;
        }
      });

      const unsubscribeCommand = commandStore.subscribe(state => {
        storeState = state;
        if (selectedVMId) {
          commands = state.commandsByVM?.[selectedVMId] || [];
        } else {
          commands = [];
        }
      });

      return () => {
        unsubscribeUI();
        unsubscribeVM();
        unsubscribeCommand();
      };
    } catch (error) {
      console.error('Failed to initialize CommandExecutionView stores:', error);
    }
  });

  const commandExecutor = getService('commandExecutor');
  const jobService = getService('jobService');

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
      await commandExecutor.executeCommand(selectedVM, cmd);
      oncommandexecute?.(cmd);
    } catch (e) {
      onalert?.({ type: 'error', message: e.message, domain: 'command-execution' });
    }
  }

  function handleEdit(c) { editingCommand = c; }
  function handleDelete(c) { deletingCommand = c; }

  async function handleCommandCreated() {
    showAddForm = false;
    if (selectedVM) {
      commandStore.loadVMCommands(selectedVM.id);
    }
  }

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

<div class="border-b">
  {#if !storesReady}
    <div class="p-4 text-center text-muted-foreground">
      Initializing...
    </div>
  {:else if !selectedVM}
    <div class="p-8 text-center text-muted-foreground">
      <h3 class="text-lg font-medium mb-2">Select a VM</h3>
      <p>Choose a virtual machine from the sidebar to view and manage commands.</p>
    </div>
  {:else if storeState.loading}
    <div class="p-4 text-center text-muted-foreground">
      Loading commands...
    </div>
  {:else if commands.length > 0}
    <div class="p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">VM Commands</h3>
        <Button size="sm" onclick={() => showAddForm = true}>Add Command</Button>
      </div>
      <CommandGrid {commands} isExecuting={isExecuting} onexecute={handleExecute} onedit={handleEdit} ondelete={handleDelete} />
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

<AddCommandForm isOpen={showAddForm} onclose={() => showAddForm = false} oncommandcreated={handleCommandCreated} />
<EditCommandModal command={editingCommand} onSave={handleUpdateCommand} onCancel={() => editingCommand = null} />
<DeleteConfirmModal command={deletingCommand} onConfirm={confirmDeleteCommand} onCancel={() => editingCommand = null} /> 
