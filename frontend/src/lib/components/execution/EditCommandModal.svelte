<script>
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { X, Terminal } from 'lucide-svelte';

  // Props
  let { command, onSave, onCancel } = $props();

  // Local state
  let formData = $state({
    name: command?.name || '',
    cmd: command?.cmd || '',
    type: command?.type || 'ssh',
    description: command?.description || '',
    timeout: command?.timeout || 30000
  });
  
  let loading = $state(false);
  let error = $state('');

  // Update form data when command changes
  $effect(() => {
    if (command) {
      formData.name = command.name || '';
      formData.cmd = command.cmd || '';
      formData.type = command.type || 'ssh';
      formData.description = command.description || '';
      formData.timeout = command.timeout || 30000;
    }
  });

  async function handleSubmit() {
    if (!formData.name.trim() || !formData.cmd.trim()) {
      error = 'Name and command are required';
      return;
    }

    loading = true;
    error = '';

    try {
      const updateData = {
        name: formData.name.trim(),
        cmd: formData.cmd.trim(),
        type: formData.type,
        description: formData.description.trim() || undefined,
        timeout: formData.timeout
      };

      await onSave(updateData);
    } catch (err) {
      error = err.message || 'Failed to update command';
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    onCancel();
  }
</script>

{#if command}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <Card class="w-full max-w-2xl mx-4">
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="flex items-center gap-2">
            <Terminal class="w-5 h-5" />
            Edit Command
          </CardTitle>
          <Button variant="ghost" size="sm" onclick={handleCancel}>
            <X class="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="name">Command Name *</Label>
          <Input
            id="name"
            bind:value={formData.name}
            placeholder="e.g., Check System Status"
            required
          />
        </div>

        <div class="space-y-2">
          <Label for="cmd">Command *</Label>
          <Textarea
            id="cmd"
            bind:value={formData.cmd}
            placeholder="e.g., ps aux | head -10"
            rows="3"
            required
          />
        </div>

        <div class="space-y-2">
          <Label for="type">Execution Type</Label>
          <Select bind:value={formData.type}>
            <SelectTrigger>
              <SelectValue placeholder="Select execution type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ssh">SSH (Remote)</SelectItem>
              <SelectItem value="local">Local</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="description">Description</Label>
          <Textarea
            id="description"
            bind:value={formData.description}
            placeholder="Optional description of what this command does"
            rows="2"
          />
        </div>

        <div class="space-y-2">
          <Label for="timeout">Timeout (ms)</Label>
          <Input
            id="timeout"
            type="number"
            bind:value={formData.timeout}
            min="1000"
            max="300000"
            step="1000"
          />
        </div>

        {#if error}
          <div class="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        {/if}

        <div class="flex justify-end gap-3 pt-4">
          <Button variant="outline" onclick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onclick={handleSubmit} disabled={loading}>
            {#if loading}
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            {/if}
            Update Command
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
{/if}
