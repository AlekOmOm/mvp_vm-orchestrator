<!--
  VM Management Panel Component
  
  Focused component for VM management operations including:
  - VM sidebar navigation
  - VM form dialogs
  - VM CRUD operations
  
  Follows modular Svelte architecture with component composition.
-->

<script>
  import { Button } from '$lib/components/ui/button';
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Plus, AlertCircle } from 'lucide-svelte';

  // VM Components
  import VMSidebar from './VMSidebar.svelte';
  import VMForm from './VMForm.svelte';

  // Stores
  import { vmStore, vms, selectedVM, vmLoading, vmError } from '../../stores/vmStore.js';
  import { vmFormStore } from '../../stores/vmFormStore.js';

  // Props for event callbacks
  let {
    onvmselected = () => {},
    onvmcreated = () => {},
    onvmupdated = () => {}
  } = $props();

  // Local state for form dialog using Svelte 5 runes
  let showVMForm = $state(false);
  let editingVM = $state(null);
  let formError = $state('');

  // Reactive store subscriptions using derived
  let vmFormState = $derived($vmFormStore);

  /**
   * Handle VM selection from sidebar
   */
  function handleVMSelect(event) {
    const vm = event.detail;
    vmStore.selectVM(vm);
    onvmselected(vm);
  }

  /**
   * Show form for creating new VM
   */
  function showAddVMForm() {
    editingVM = null;
    showVMForm = true;
    formError = '';
    vmFormStore.showCreateForm();
  }

  /**
   * Show form for editing existing VM
   */
  function showEditVMForm(vm) {
    editingVM = vm;
    showVMForm = true;
    formError = '';
    vmFormStore.showEditForm(vm);
  }

  /**
   * Handle VM form submission with proper event handling
   */
  async function handleVMFormSubmit(data) {
    try {
      const { vmData, isEdit } = data;

      if (isEdit && editingVM) {
        await vmStore.updateVM(editingVM.id, vmData);
        onvmupdated({ vm: editingVM, updates: vmData });
      } else {
        const newVM = await vmStore.createVM(vmData);
        onvmcreated(newVM);
      }

      // Close form on success
      showVMForm = false;
      editingVM = null;
      formError = '';
      vmFormStore.hideForm();
    } catch (error) {
      console.error('VM form submission failed:', error);
      formError = error.message;
    }
  }

  /**
   * Handle form cancellation
   */
  function handleVMFormCancel() {
    showVMForm = false;
    editingVM = null;
    formError = '';
    vmFormStore.hideForm();
  }

  /**
   * Handle VM edit request from sidebar
   */
  function handleVMEdit(event) {
    showEditVMForm(event.detail);
  }

  /**
   * Clear VM error state
   */
  function clearVMError() {
    vmStore.clearError();
  }
</script>

<!-- VM Management Panel -->
<div class="vm-management-panel h-full flex flex-col">
  <!-- Header with Add VM button -->
  <div class="flex items-center justify-between p-4 border-b bg-white">
    <h2 class="text-lg font-semibold text-gray-900">Virtual Machines</h2>
    <Button on:click={showAddVMForm} size="sm">
      <Plus class="w-4 h-4 mr-2" />
      Add VM
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
      on:vm-select={handleVMSelect}
      on:vm-edit={handleVMEdit}
    />
  </div>

  <!-- Selected VM Info -->
  {#if $selectedVM}
    <div class="p-4 border-t bg-gray-50">
      <div class="text-sm">
        <div class="font-medium text-gray-900">Selected VM</div>
        <div class="text-gray-600">{$selectedVM.name}</div>
        <div class="text-xs text-gray-500 font-mono">
          {$selectedVM.userName}@{$selectedVM.host}
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- VM Form Dialog -->
<Dialog bind:open={showVMForm}>
  <DialogContent class="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>
        {editingVM ? 'Edit VM' : 'Add New VM'}
      </DialogTitle>
    </DialogHeader>
    
    <!-- Form Error Display -->
    {#if formError}
      <Alert variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>{formError}</AlertDescription>
      </Alert>
    {/if}
    
    <!-- VM Form -->
    <VMForm
      vm={editingVM}
      loading={vmFormState.loading}
      error={vmFormState.error}
      onsubmit={handleVMFormSubmit}
      oncancel={handleVMFormCancel}
    />
  </DialogContent>
</Dialog>

<style>
  .vm-management-panel {
    min-width: 300px;
    max-width: 400px;
  }
</style>
