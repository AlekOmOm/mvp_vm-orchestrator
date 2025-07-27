<!--
  VM Form Component
  
  Form for creating and editing VM configurations.
  Supports validation and different modes (create/edit).
-->

<script>
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label as FormLabel, Label } from '$lib/components/ui/label';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Loader2 } from '@lucide/svelte';

  // Props using Svelte 5 runes
  let {
    vm = null,
    loading = false,
    error = null,
    onsubmit = () => {},
    oncancel = () => {},
    ondelete = () => {}
  } = $props();

  // Form data state
  let formData = $state({
    name: '',
    host: '',
    user: '',
    environment: 'development',
    description: ''
  });

  let validationErrors = $state([]);

  // Update form data when vm prop changes
  $effect(() => {
    if (vm) {
      formData.name = vm.name || '';
      formData.host = vm.host || '';
      formData.user = vm.user || '';
      formData.environment = vm.environment || 'development';
      formData.description = vm.description || '';
    } else {
      formData.name = '';
      formData.host = '';
      formData.user = '';
      formData.environment = 'development';
      formData.description = '';
    }
  });

  /**
   * Validate form data
   */
  function validateForm() {
    validationErrors.length = 0;

    if (!formData.name.trim()) {
      validationErrors.push('VM name is required');
    }

    if (!formData.host.trim()) {
      validationErrors.push('Host is required');
    }

    if (!formData.user.trim()) {
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

    onsubmit({
      vmData: { ...formData },
      isEdit: !!vm
    });
  }

  /**
   * Handle form cancellation
   */
  function handleCancel() {
    oncancel();
  }

  /**
   * Handle VM deletion
   */
  function handleDelete() {
    if (vm && confirm(`Are you sure you want to delete VM "${vm.name}"? This action cannot be undone.`)) {
      ondelete(vm);
    }
  }
</script>

<div class="space-y-4">
  <div class="grid grid-cols-2 gap-4">
    <div class="space-y-2">
      <FormLabel for="vm-name">VM Name *</FormLabel>
      <Input
        id="vm-name"
        bind:value={formData.name}
        placeholder="e.g., prometheus-vm"
        disabled={loading}
      />
    </div>

    <div class="space-y-2">
      <FormLabel for="vm-host">Host *</FormLabel>
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
      <FormLabel for="vm-username">Username *</FormLabel>
      <Input
        id="vm-username"
        bind:value={formData.user}
        placeholder="e.g., ubuntu"
        disabled={loading}
      />
    </div>

    <div class="space-y-2">
      <FormLabel for="vm-environment">Environment</FormLabel>
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
    <FormLabel for="vm-description">Description (Optional)</FormLabel>
    <Input
      id="vm-description"
      bind:value={formData.description}
      placeholder="e.g., Production web server"
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

  <div class="flex justify-between">
    <div>
      {#if vm}
        <Button variant="destructive" onclick={handleDelete} disabled={loading}>
          Delete VM
        </Button>
      {/if}
    </div>
    <div class="flex space-x-2">
      <Button variant="outline" onclick={handleCancel} disabled={loading}>
        Cancel
      </Button>
      <Button onclick={handleSubmit} disabled={loading}>
        {#if loading}
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
        {/if}
        {vm ? 'Update VM' : 'Create VM'}
      </Button>
    </div>
  </div>
</div>
