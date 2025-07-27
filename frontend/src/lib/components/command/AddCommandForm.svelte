<!--
  Add Command Form Component
  
  Shows available command templates as suggestions when creating new commands.
  Uses Svelte 5 syntax with $props(), $state(), and $derived().
-->

<script>
  import { Button } from '$lib/components/ui/button';
  import TemplateCard from './TemplateCard.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label as FormLabel, Label } from '$lib/components/ui/label';
  import Modal from '$lib/components/ui/Modal.svelte';
  import {
    Plus,
    Terminal,
    Loader2
  } from '@lucide/svelte';

  // Stores
  import { selectedVM } from '../../stores/vmStore.js';
  import { commandStore, availableTemplatesArray } from '../../stores/commandStore.js';

  // Props
  let { 
    isOpen = false, 
    onclose = () => {}, 
    oncommandcreated = () => {} 
  } = $props();

  // Local state
  let formData = $state({
    name: '',
    cmd: '',
    type: 'ssh',
    description: '',
    timeout: 30000
  });
  let isSubmitting = $state(false);
  let errorMessage = $state('');

  // Load available templates when component mounts
  $effect(() => {
    if (isOpen) {
      commandStore.loadAvailableTemplates();
    }
  });

  /**
   * Handle template selection
   */
  function selectTemplate(template) {
    formData.name = template.name;
    formData.cmd = template.cmd;
    formData.type = template.type;
    formData.description = template.description;
    formData.timeout = template.timeout || 30000;
  }

  /**
   * Reset form
   */
  function resetForm() {
    formData = {
      name: '',
      cmd: '',
      type: 'ssh',
      description: '',
      timeout: 30000
    };
    errorMessage = '';
  }

  /**
   * Handle form submission
   */
  async function handleSubmit(event) {
    event.preventDefault();
    if (!$selectedVM) {
      errorMessage = 'Please select a VM first';
      return;
    }

    if (!formData.name.trim() || !formData.cmd.trim()) {
      errorMessage = 'Name and command are required';
      return;
    }

    isSubmitting = true;
    errorMessage = '';

    try {
      await commandStore.createCommand($selectedVM.id, {
        name: formData.name.trim(),
        cmd: formData.cmd.trim(),
        type: formData.type,
        description: formData.description.trim(),
        timeout: formData.timeout
      });

      oncommandcreated();
      resetForm();
      onclose();
    } catch (error) {
      console.error('Failed to create command:', error);
      errorMessage = error.message || 'Failed to create command';
    } finally {
      isSubmitting = false;
    }
  }

  /**
   * Handle close
   */
  function handleClose() {
    resetForm();
    onclose();
  }
</script>

<Modal
  {isOpen}
  onClose={handleClose}
  title="Add New Command"
  size="lg"
>
  {#snippet children()}

    <div class="flex h-[70vh]">
      <!-- Available Templates -->
      <div class="w-1/2 border-r overflow-y-auto">
        <div class="p-4">
          <h3 class="text-lg font-medium mb-4">Available Templates</h3>

          {#if $availableTemplatesArray.length > 0}
            <div class="space-y-3">
              {#each $availableTemplatesArray as template (template.id)}
                <TemplateCard {template} on:select={() => selectTemplate(template)} />
              {/each}
            </div>
          {:else}
            <div class="text-center text-gray-500 py-8">
              <Terminal class="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No command templates available</p>
            </div>
          {/if}
        </div>
      </div>

      <!-- Form -->
      <div class="w-1/2 overflow-y-auto">
        <form onsubmit={handleSubmit} class="p-4 space-y-4">
          <!-- Name -->
          <div>
            <FormLabel for="command-name">Command Name</FormLabel>
            <Input
              id="command-name"
              bind:value={formData.name}
              placeholder="e.g., docker-status"
              required
            />
          </div>

          <!-- Command -->
          <div>
            <FormLabel for="command-cmd">Command</FormLabel>
            <Textarea
              id="command-cmd"
              bind:value={formData.cmd}
              placeholder="e.g., docker ps"
              rows="3"
              required
            />
          </div>

          <!-- Type -->
          <div>
            <FormLabel for="command-type">Type</FormLabel>
            <select
              id="command-type"
              bind:value={formData.type}
              class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="ssh">SSH (Remote)</option>
              <option value="stream">Stream (Local)</option>
              <option value="terminal">Terminal</option>
            </select>
          </div>

          <!-- Description -->
          <div>
            <FormLabel for="command-description">Description (Optional)</FormLabel>
            <Textarea
              id="command-description"
              bind:value={formData.description}
              placeholder="Brief description of what this command does"
              rows="2"
            />
          </div>

          <!-- Timeout -->
          <div>
            <FormLabel for="command-timeout">Timeout (ms)</FormLabel>
            <Input
              id="command-timeout"
              type="number"
              bind:value={formData.timeout}
              min="1000"
              max="300000"
              step="1000"
            />
          </div>

          <!-- Error Message -->
          {#if errorMessage}
            <div class="text-destructive text-sm bg-destructive/10 p-3 rounded border border-destructive/20">
              {errorMessage}
            </div>
          {/if}

          <!-- Actions -->
          <div class="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || !formData.cmd.trim()}
              class="flex-1"
            >
              {#if isSubmitting}
                <Loader2 class="w-4 h-4 mr-2 animate-spin" />
                Creating...
              {:else}
                <Plus class="w-4 h-4 mr-2" />
                Create Command
              {/if}
            </Button>
            <Button type="button" variant="outline" onclick={handleClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  {/snippet}
</Modal>


