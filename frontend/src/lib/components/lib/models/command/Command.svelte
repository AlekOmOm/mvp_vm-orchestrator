<script>
import { Button } from '$lib/components/lib/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/lib/ui/card';
import { Badge } from '$lib/components/lib/ui/badge';
import { Terminal, Edit, Trash2, Play, Loader2, Code, Zap } from 'lucide-svelte';

// state - global state access
import { getSelectedVM } from '$lib/state/ui.state.svelte.js';
import { getCommandStore } from '$lib/state/stores.state.svelte.js';
import { getService } from '$lib/core/ServiceContainer.js';

// crud components
import EditCommandModal from './crud/EditCommandModal.svelte';
import DeleteConfirmModal from './crud/DeleteConfirmModal.svelte';

// Props - ONLY identity data
let { command } = $props();

// State access
const selectedVM = $derived(getSelectedVM());
const commandStore = $derived(getCommandStore());
const commandExecutor = getService('commandExecutor');

// Local UI state
let showEditModal = $state(false);
let showDeleteModal = $state(false);

// Computed
const isExecuting = $derived(commandExecutor.getIsExecuting());
const currentJob = $derived(commandExecutor.getCurrentJob());
const isCurrentCommand = $derived(currentJob?.command === command.cmd);

// Self-contained handlers
function handleExecute() {
  if (selectedVM && !isExecuting) {
    commandExecutor.executeCommand(selectedVM, command);
  }
}

function handleEdit() {
  showEditModal = true;
}

function handleDelete() {
  showDeleteModal = true;
}

async function handleSaveEdit(updateData) {
  await commandStore.updateCommand(command.id, updateData);
  showEditModal = false;
}

async function handleConfirmDelete() {
  await commandStore.deleteCommand(command.id);
  showDeleteModal = false;
}
</script>

<Card class="w-full max-w-[320px] transition-all duration-200 {isCurrentCommand ? 'ring-2 ring-orange-500 border-orange-500' : 'hover:shadow-md'}">
  <CardHeader class="pb-2 w-full">
    <div class="flex items-start justify-between w-full max-w-full overflow-hidden">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <typeConfig.icon class="w-4 h-4 text-primary" />
        </div>
        <div class="min-w-0 flex-1">
          <CardTitle class="text-base flex flex-wrap items-center gap-2">
            <span class="break-all">{command.name}</span>
            {#if isCurrentCommand}
              <Loader2 class="w-3 h-3 animate-spin text-orange-600" />
            {/if}
          </CardTitle>
          <p class="text-xs text-muted-foreground mt-1 font-mono break-all max-w-full whitespace-normal">
            {displayCmd}
          </p>
        </div>
      </div>
      <Badge variant={typeConfig.variant} class="text-xs">
        {command.type}
      </Badge>
    </div>
  </CardHeader>

  <CardContent class="space-y-2">
    {#if command.description}
      <p class="text-sm text-muted-foreground">{command.description}</p>
    {/if}

    {#if command.cmd.length > 50}
      <details class="text-xs">
        <summary class="cursor-pointer text-muted-foreground hover:text-foreground">View full command</summary>
        <pre class="mt-2 p-2 bg-muted rounded text-xs font-mono whitespace-pre-wrap break-all">{command.cmd}</pre>
      </details>
    {/if}

    <div class="flex items-center justify-between text-xs text-muted-foreground">
      <div class="flex items-center gap-2">
        <span>Created: {createdDate}</span>
        <span class="capitalize">{typeConfig.description}</span>
      </div>
    </div>

    <div class="flex gap-2 pt-2 border-t">
      <Button variant={isCurrentCommand ? 'secondary' : 'default'} size="sm" onclick={handleExecute} disabled={isExecuting} class="flex-1">
        {#if isCurrentCommand}
          <Loader2 class="w-3 h-3 mr-1 animate-spin" /> Running
        {:else}
          <Play class="w-3 h-3 mr-1" /> Execute
        {/if}
      </Button>

      <Button variant="outline" size="sm" onclick={handleEdit} disabled={isExecuting}>
        <Edit class="w-3 h-3" />
      </Button>

      <!-- no delete button, not until much later -->

    </div>
  </CardContent>
</Card>

<!-- Self-contained CRUD modals -->
<EditCommandModal 
  {command} 
  bind:isOpen={showEditModal}
  onSave={handleSaveEdit}
  onCancel={() => showEditModal = false}
/>

<DeleteConfirmModal
  {command}
  bind:isOpen={showDeleteModal}
  onConfirm={handleConfirmDelete}
  onCancel={() => showDeleteModal = false}
/>



