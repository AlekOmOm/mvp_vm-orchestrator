<script>
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { X, Plus, Terminal } from 'lucide-svelte';
  import { serviceContainer } from '../../core/ServiceContainer.js';

  let { vmId, onCancel, onSubmit } = $props();

  let formData = $state({
    name: '',
    cmd: '',
    type: 'ssh',
    description: '',
    timeout: 30000
  });
  
  let commandTemplates = $state([]);
  let loading = $state(false);
  let error = $state('');
  let showTemplates = $state(true);

  $effect(() => {
    loadCommandTemplates();
  });

  async function loadCommandTemplates() {
    try {
      const apiClient = serviceContainer.get('apiClient');
      const templates = await apiClient.get('/api/commands');
      commandTemplates = Object.entries(templates).map(([key, template]) => ({
        id: key,
        ...template
      }));
    } catch (err) {
    }
  }

  function useTemplate(template) {
    formData.name = template.description || template.cmd;
    formData.cmd = template.cmd;
    formData.type = template.type === 'ssh' ? 'ssh' : 'local';
    formData.description = template.description || '';
    if (template.timeout) {
      formData.timeout = template.timeout;
    }
    showTemplates = false;
  }

  async function handleSubmit() {
    if (!formData.name.trim() || !formData.cmd.trim()) {
      error = 'Name and command are required';
      return;
    }

    loading = true;
    error = '';

    try {
      const apiClient = serviceContainer.get('apiClient');
      const commandData = {
        name: formData.name.trim(),
        cmd: formData.cmd.trim(),
        type: formData.type,
        description: formData.description.trim() || undefined,
        timeout: formData.timeout
      };

      const newCommand = await apiClient.post(`/api/vms/${vmId}/commands`, commandData);
      onSubmit(newCommand);
    } catch (err) {
      error = err.message || 'Failed to create command';
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    onCancel();
  }
</script>

<Card class="w-full max-w-2xl">
  <CardHeader>
    <div class="flex items-center justify-between">
      <CardTitle class="flex items-center gap-2">
        <Terminal class="w-5 h-5" />
        Add New Command
      </CardTitle>
      <Button variant="ghost" size="sm" onclick={handleCancel}>
        <X class="w-4 h-4" />
      </Button>
    </div>
  </CardHeader>

  <CardContent class="space-y-6">
    {#if showTemplates && commandTemplates.length > 0}
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <Label class="text-sm font-medium">Quick Start Templates</Label>
          <Button variant="ghost" size="sm" onclick={() => showTemplates = false}>
            Skip Templates
          </Button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          {#each commandTemplates as template}
            <div class="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer" onclick={() => useTemplate(template)}>
              <div class="flex items-center justify-between mb-2">
                <Badge variant="outline" class="text-xs">{template.type}</Badge>
              </div>
              <h4 class="font-medium text-sm mb-1">{template.description}</h4>
              <code class="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{template.cmd}</code>
            </div>
          {/each}
        </div>
        <div class="border-t pt-4">
          <Button variant="outline" onclick={() => showTemplates = false} class="w-full">
            <Plus class="w-4 h-4 mr-2" />
            Create Custom Command
          </Button>
        </div>
      </div>
    {:else}
      <div class="space-y-4">
        {#if commandTemplates.length > 0}
          <Button variant="ghost" size="sm" onclick={() => showTemplates = true} class="mb-4">
            ← Back to Templates
          </Button>
        {/if}

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
            Create Command
          </Button>
        </div>
      </div>
    {/if}
  </CardContent>
</Card>
