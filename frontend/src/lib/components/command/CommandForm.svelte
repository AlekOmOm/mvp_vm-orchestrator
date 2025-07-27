<!--
  Command Form Component
  
  Form for creating and editing command configurations.
  Supports validation and different command types.
-->

<script>
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Select } from '$lib/components/ui/select';
  import { Save, X, Loader2 } from 'lucide-svelte';

  let {
    command = null,
    vmId = null,
    loading = false,
    oncreate = () => {},
    onupdate = () => {},
    oncancel = () => {},
    ondelete = () => {}
  } = $props();

  // Form data
  let formData = {
    name: '',
    cmd: '',
    type: 'stream',
    description: '',
    timeout: 30000
  };

  // Initialize form data when command prop changes
  $effect(() => {
    if (command) {
      formData = {
        name: command.name || '',
        cmd: command.cmd || '',
        type: command.type || 'stream',
        description: command.description || '',
        timeout: command.timeout || 30000
      };
    } else {
      formData = {
        name: '',
        cmd: '',
        type: 'stream',
        description: '',
        timeout: 30000
      };
    }
  });

  // Form validation
  let errors = {};
  
  function validateForm() {
    errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.cmd.trim()) {
      errors.cmd = 'Command is required';
    }
    
    if (!formData.type) {
      errors.type = 'Type is required';
    }
    
    if (formData.timeout < 1000 || formData.timeout > 300000) {
      errors.timeout = 'Timeout must be between 1 and 300 seconds';
    }
    
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    if (!validateForm()) return;

    if (command) {
      onupdate({ id: command.id, updates: formData });
    } else {
      oncreate({ vmId, ...formData });
    }
  }

  function handleCancel() {
    oncancel();
  }

  function handleDelete() {
    if (command && confirm(`Are you sure you want to delete command "${command.name}"? This action cannot be undone.`)) {
      ondelete(command);
    }
  }

  // Command type options
  const commandTypes = [
    { value: 'stream', label: 'Stream', description: 'Real-time output streaming' },
    { value: 'ssh', label: 'SSH', description: 'Execute via SSH connection' },
    { value: 'terminal', label: 'Terminal', description: 'Spawn new terminal window' }
  ];

  // Convert timeout to seconds for display
  $: timeoutSeconds = Math.round(formData.timeout / 1000);
  
  function updateTimeout(seconds) {
    formData.timeout = seconds * 1000;
  }

  $: isEdit = !!command;
  $: title = isEdit ? `Edit ${command.name}` : 'Create New Command';
</script>

<Card>
  <CardHeader>
    <CardTitle class="flex items-center justify-between">
      {title}
      <Badge variant="outline" class="text-xs">
        {isEdit ? 'Edit Mode' : 'Create Mode'}
      </Badge>
    </CardTitle>
  </CardHeader>

  <CardContent class="space-y-4">
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <!-- Name -->
      <div class="space-y-2">
        <Label for="name">Name *</Label>
        <Input
          id="name"
          bind:value={formData.name}
          placeholder="e.g., docker-ps"
          class={errors.name ? 'border-destructive' : ''}
          disabled={loading}
        />
        {#if errors.name}
          <p class="text-sm text-destructive">{errors.name}</p>
        {/if}
      </div>

      <!-- Command -->
      <div class="space-y-2">
        <Label for="cmd">Command *</Label>
        <Textarea
          id="cmd"
          bind:value={formData.cmd}
          placeholder="e.g., docker ps"
          rows="3"
          class={errors.cmd ? 'border-destructive' : ''}
          disabled={loading}
        />
        {#if errors.cmd}
          <p class="text-sm text-destructive">{errors.cmd}</p>
        {/if}
        <p class="text-xs text-muted-foreground">
          Enter the shell command to execute on the target VM
        </p>
      </div>

      <!-- Type and Timeout -->
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="type">Type *</Label>
          <Select 
            id="type"
            bind:value={formData.type} 
            disabled={loading}
            class={errors.type ? 'border-destructive' : ''}
          >
            {#each commandTypes as type}
              <option value={type.value}>{type.label}</option>
            {/each}
          </Select>
          {#if errors.type}
            <p class="text-sm text-destructive">{errors.type}</p>
          {:else}
            <p class="text-xs text-muted-foreground">
              {commandTypes.find(t => t.value === formData.type)?.description || ''}
            </p>
          {/if}
        </div>

        <div class="space-y-2">
          <Label for="timeout">Timeout (seconds)</Label>
          <Input
            id="timeout"
            type="number"
            value={timeoutSeconds}
            on:input={(e) => updateTimeout(parseInt(e.target.value) || 30)}
            min="1"
            max="300"
            class={errors.timeout ? 'border-destructive' : ''}
            disabled={loading}
          />
          {#if errors.timeout}
            <p class="text-sm text-destructive">{errors.timeout}</p>
          {/if}
        </div>
      </div>

      <!-- Description -->
      <div class="space-y-2">
        <Label for="description">Description</Label>
        <Textarea
          id="description"
          bind:value={formData.description}
          placeholder="Optional description of what this command does"
          rows="2"
          disabled={loading}
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 pt-4 border-t">
        <Button type="submit" disabled={loading} class="flex-1">
          {#if loading}
            <Loader2 class="w-4 h-4 mr-2 animate-spin" />
          {:else}
            <Save class="w-4 h-4 mr-2" />
          {/if}
          {isEdit ? 'Update Command' : 'Create Command'}
        </Button>

        <Button type="button" variant="outline" onclick={handleCancel} disabled={loading}>
          <X class="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  </CardContent>
</Card>
