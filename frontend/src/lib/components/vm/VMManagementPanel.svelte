<!--
  VM Management Panel Component

  Read-only VM management interface with auto-discovery:
  - VM sidebar navigation
  - SSH host discovery
  - Connection testing

  VMs are auto-discovered from ~/.ssh/config
-->

<script>
  import { Button } from '$lib/components/ui/button';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { AlertCircle } from 'lucide-svelte';
  import Panel from '$lib/components/ui/Panel.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import VMForm from './VMForm.svelte';
  import CommandPanel from '../command/CommandPanel.svelte';
  import AddCommandForm from '../command/AddCommandForm.svelte';
  import { commandStore } from '../../stores/commandStore.js';

  // VM Components
  import VMSidebar from './VMSidebar.svelte';

  // Stores
  import { vmStore, vms, selectedVM, vmLoading, vmError } from '../../stores/vmStore.js';

  // Props for event callbacks
  let {
    onvmselected = () => {},
    onvmedited = () => {},
    onvmdeleted = () => {},
    onvmmanagecommands = () => {}
  } = $props();

  let showEdit = $state(false);
  let showCommands = $state(false);
  let activeVM = $state(null);
  let vmCommandsGrouped = $state({});
  let commandsLoading = $state(false);
  let showAddCommand = $state(false);

  /**
   * Handle VM selection from sidebar
   */
  function handleVMSelect(vm) {
    vmStore.selectVM(vm);
    onvmselected(vm);
  }

  function handleVMEdit(vm) {
    activeVM = vm;
    showEdit = true;
    onvmedited(vm);
  }

  function handleVMDelete(vm) {
    console.log('Delete VM', vm);
    onvmdeleted(vm);
  }

  async function loadCommands(vm) {
    try {
      commandsLoading = true;
      vmCommandsGrouped = {};
      await commandStore.loadVMCommands(vm.id);
      const list = commandStore.getCommandsForVM(vm.id);
      const grouped = {};
      list.forEach((cmd) => {
        const group = cmd.group || 'general';
        if (!grouped[group]) {
          grouped[group] = { type: cmd.type || 'unknown', commands: [] };
        }
        grouped[group].commands.push(cmd);
      });
      vmCommandsGrouped = grouped;
    } catch (e) {
      console.error('Failed to load commands', e);
      vmCommandsGrouped = {};
    } finally {
      commandsLoading = false;
    }
  }

  function handleVMManageCommands(vm) {
    activeVM = vm;
    loadCommands(vm);
    showCommands = true;
    onvmmanagecommands(vm);
  }

  function handleAddCommand() {
    showAddCommand = true;
  }

  async function handleCommandCreated() {
    if (activeVM) {
      await loadCommands(activeVM);
    }
  }

  async function handleAddDefaults() {
    // optional future implementation
    console.log('Add default commands');
  }

  /**
   * Refresh VMs from SSH discovery
   */
  async function refreshVMs() {
    try {
      await vmStore.refreshVMs();
    } catch (error) {
      console.error('Failed to refresh VMs:', error);
    }
  }


  /**
   * Clear VM error state
   */
  function clearVMError() {
    vmStore.clearError();
  }
</script>

<!-- VM Management Panel -->
<Panel variant="sidebar" class="h-full flex flex-col">
  <!-- Header with Refresh button -->
  <div class="flex items-center justify-between p-4 border-b border-border bg-card">
    <h2 class="text-lg font-semibold text-card-foreground">Virtual Machines</h2>
    <Button on:click={refreshVMs} size="sm" variant="outline">
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
      Refresh
    </Button>
  </div>

  <!-- VM Error Display -->
  {#if $vmError}
    <div class="p-4">
      <Alert variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>
          {$vmError}
          <Button variant="outline" size="sm" on:click={clearVMError} class="ml-2">
            Dismiss
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  {/if}

  <!-- VM Sidebar -->
  <div class="flex-1 overflow-hidden">
    <VMSidebar
      vms={$vms}
      selectedVM={$selectedVM}
      loading={$vmLoading}
      error={$vmError}
      onvmselect={handleVMSelect}
      onvmedit={handleVMEdit}
      onvmdelete={handleVMDelete}
      onvmmanagecommands={handleVMManageCommands}
    />
  </div>

  <!-- Selected VM Info -->
  {#if $selectedVM}
    <div class="p-4 border-t border-border bg-muted">
      <div class="text-sm space-y-1">
        <div class="font-medium text-foreground">Selected VM</div>
        <div class="text-muted-foreground">{$selectedVM.name}</div>
        <div class="text-xs text-muted-foreground font-mono">
          {$selectedVM.user}@{$selectedVM.host}
        </div>
        {#if $selectedVM.cloudProvider}
          <div class="text-xs text-primary">
            {$selectedVM.cloudProvider}
          </div>
        {/if}
        <div class="text-xs text-muted-foreground">
          SSH Alias: {$selectedVM.alias}
        </div>
      </div>
    </div>
  {/if}
</Panel>

<Modal isOpen={showEdit} title="Edit VM" onClose={() => (showEdit = false)}>
  <div class="p-6">
    <VMForm vm={activeVM} onsubmit={() => (showEdit = false)} oncancel={() => (showEdit = false)} />
  </div>
</Modal>

<Modal isOpen={showCommands} title="Commands" size="lg" onClose={() => (showCommands = false)}>
  <CommandPanel
    commands={vmCommandsGrouped}
    loading={commandsLoading}
    vmName={activeVM?.name}
    onexecute={() => {}}
    onaddcommand={handleAddCommand}
    onadddefaults={handleAddDefaults}
  />
</Modal>

<AddCommandForm
  isOpen={showAddCommand}
  onclose={() => (showAddCommand = false)}
  oncommandcreated={handleCommandCreated}
/>



