<!--
  Add Command Form Component
  
  Shows available command templates as suggestions when creating new commands.
  Uses Svelte 5 syntax with $props(), $state(), and $derived().
  test
-->

<script>
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Terminal } from '@lucide/svelte';
  import TemplateCard from './TemplateCard.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label as FormLabel, Label } from '$lib/components/ui/label';
  import { onMount } from 'svelte';
  import { storesContainer } from '../../stores/StoresContainer.js';

  let vmStore = $state(null);
  let commandStore = $state(null);
  let selectedVM = $state(null);
  let availableTemplatesArray = $state([]);

  // Set up reactive effects synchronously - subscribe to store changes
  $effect(() => {
    if (vmStore) {
      const unsubscribe = vmStore.subscribe((state) => {
        selectedVM = state.selectedVM;
      });
      return unsubscribe;
    }
  });

  $effect(() => {
    if (commandStore) {
      const unsubscribe = commandStore.subscribe((state) => {
        availableTemplatesArray = Object.entries(state.availableTemplates).map(([key, config]) => ({
          id: key,
          name: key,
          cmd: config.cmd,
          type: config.type,
          description: config.description,
          hostAlias: config.hostAlias,
          timeout: config.timeout || 30000,
        }));
      });
      return unsubscribe;
    }
  });

  // Initialize stores asynchronously
  onMount(async () => {
    try {
      vmStore = await storesContainer.get('vmStore');
      commandStore = await storesContainer.get('commandStore');
      await vmStore.loadVMs();
      await commandStore.loadAvailableTemplates();
    } catch (error) {
      console.error('Failed to initialize stores:', error);
    }
  });

  // Form state
  let showVMForm = $state(false);
  let showCommandForm = $state(false);


  // Props
  let { 
    isOpen = $bindable(false), 
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

  // Templates are automatically loaded by the composable
  // No need for manual loading

  function sanitizeCommand(cmd) {
    return cmd.split(/\r?\n/).map(line => line.trim()).filter(Boolean).join(' ').trim();
  }

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

  // Derived validation state
  let isFormValid = $derived(
    formData.name.trim().length > 0 && 
    formData.cmd.trim().length > 0
  );

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
    if (!selectedVM) {
      errorMessage = 'Please select a VM first';
      return;
    }

    if (!isFormValid) {
      errorMessage = 'Name and command are required';
      return;
    }

    isSubmitting = true;
    errorMessage = '';

    try {
      const commandData = {
        name: formData.name.trim(),
        cmd: sanitizeCommand(formData.cmd),
        type: formData.type,
        description: formData.description.trim(),
        timeout: formData.timeout
      };

      console.log('Creating command:', commandData);
      console.log('Selected VM:', selectedVM);

      await commandStore.createCommand(selectedVM.id, commandData);

      oncommandcreated();
      resetForm();
      onclose();
    } catch (error) {
      console.error('Failed to create command:', error);
      
      // Handle specific error cases
      if (error.message.includes('409') || error.message.includes('Conflict')) {
        errorMessage = 'A command with this name already exists. Please choose a different name.';
      } else {
        errorMessage = error.message || 'Failed to create command';
      }
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

<Dialog bind:open={isOpen}>
  <DialogContent class="sm:max-w-4xl max-h-[80vh]">
    <DialogHeader>
      <DialogTitle>Add New Command</DialogTitle>
    </DialogHeader>
    
    <div class="flex h-[60vh] gap-4">
      <!-- Available Templates -->
      <div class="w-1/2 border-r pr-4 overflow-y-auto">
        <h3 class="text-lg font-medium mb-4">Available Templates</h3>
        
        {#if availableTemplatesArray.length > 0}
          <div class="space-y-3">
            {#each availableTemplatesArray as template (template.id)}
              <TemplateCard {template} onselect={() => selectTemplate(template)} />
            {/each}
          </div>
        {:else}
          <div class="text-center text-muted-foreground py-8">
            <Terminal class="w-12 h-12 mx-auto mb-4" />
            <p>No command templates available</p>
          </div>
        {/if}
      </div>
      
      <!-- Form -->
      <div class="w-1/2 pl-4 overflow-y-auto">
        <form onsubmit={handleSubmit} class="p-4 space-y-4">
          <!-- Name -->
          <div>
            <FormLabel for="command-name">Command Name</FormLabel>
            <Input
              id="command-name"
              bind:value={formData.name}
              oninput={(e) => {
                formData.name = e.target.value;
              }}
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
              oninput={(e) => {
                formData.cmd = e.target.value;
              }}
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
              oninput={(e) => {
                formData.description = e.target.value;
              }}
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
              oninput={(e) => {
                formData.timeout = e.target.value;
              }}
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
              disabled={isSubmitting || !isFormValid}
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
  </DialogContent>
</Dialog>


