<!--
  VM Form Component
  
  Form for creating and editing VM configurations.
  Supports validation and different modes (create/edit).
-->

<script>
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Loader2 } from 'lucide-svelte';

  export let vm = null; // For editing existing VM
  export let loading = false;
  export let error = null;

  const dispatch = createEventDispatcher();

  // Form data
  let formData = {
    name: vm?.name || '',
    host: vm?.host || '',
    userName: vm?.userName || '',
    environment: vm?.environment || 'development',
    sshHost: vm?.sshHost || ''
  };

  let validationErrors = [];

  /**
   * Validate form data
   */
  function validateForm() {
    validationErrors = [];
    
    if (!formData.name.trim()) {
      validationErrors.push('VM name is required');
    }
    
    if (!formData.host.trim()) {
      validationErrors.push('Host is required');
    }
    
    if (!formData.userName.trim()) {
      validationErrors.push('Username is required');
    }

    return validationErrors.length === 0;
  }

  /**
   * Handle form submission
   */
  function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    dispatch('submit', {
      vmData: { ...formData },
      isEdit: !!vm
    });
  }

  /**
   * Handle form cancellation
   */
  function handleCancel() {
    dispatch('cancel');
  }

  // Update form data when vm prop changes
  $: if (vm) {
    formData = {
      name: vm.name || '',
      host: vm.host || '',
      userName: vm.userName || '',
      environment: vm.environment || 'development',
      sshHost: vm.sshHost || ''
    };
  }
</script>

<div class="space-y-4">
  <div class="grid grid-cols-2 gap-4">
    <div class="space-y-2">
      <Label for="vm-name">VM Name *</Label>
      <Input
        id="vm-name"
        bind:value={formData.name}
        placeholder="e.g., prometheus-vm"
        disabled={loading}
      />
    </div>

    <div class="space-y-2">
      <Label for="vm-host">Host *</Label>
      <Input
        id="vm-host"
        bind:value={formData.host}
        placeholder="e.g., 192.168.1.100"
        disabled={loading}
      />
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div class="space-y-2">
      <Label for="vm-username">Username *</Label>
      <Input
        id="vm-username"
        bind:value={formData.userName}
        placeholder="e.g., ubuntu"
        disabled={loading}
      />
    </div>

    <div class="space-y-2">
      <Label for="vm-environment">Environment</Label>
      <select
        id="vm-environment"
        bind:value={formData.environment}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        disabled={loading}
      >
        <option value="development">Development</option>
        <option value="staging">Staging</option>
        <option value="production">Production</option>
      </select>
    </div>
  </div>

  <div class="space-y-2">
    <Label for="vm-ssh-host">SSH Host Alias (Optional)</Label>
    <Input
      id="vm-ssh-host"
      bind:value={formData.sshHost}
      placeholder="e.g., prometheus (from ~/.ssh/config)"
      disabled={loading}
    />
  </div>

  {#if validationErrors.length > 0}
    <Alert variant="destructive">
      <AlertDescription>
        <ul class="list-disc list-inside">
          {#each validationErrors as error}
            <li>{error}</li>
          {/each}
        </ul>
      </AlertDescription>
    </Alert>
  {/if}

  {#if error}
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  {/if}

  <div class="flex justify-end space-x-2">
    <Button variant="outline" on:click={handleCancel} disabled={loading}>
      Cancel
    </Button>
    <Button on:click={handleSubmit} disabled={loading}>
      {#if loading}
        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
      {/if}
      {vm ? 'Update VM' : 'Create VM'}
    </Button>
  </div>
</div>
