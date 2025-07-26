<!--
  Command Component
  
  Displays a single command with its details and action buttons.
  Supports execution, editing, and deletion operations.
-->

<script>
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { 
    Terminal, 
    Edit, 
    Trash2, 
    Play, 
    Loader2,
    Code,
    Zap
  } from 'lucide-svelte';

  export let command;
  export let isExecuting = false;
  export let isCurrentCommand = false;

  const dispatch = createEventDispatcher();

  function handleExecute() {
    dispatch('execute', command);
  }

  function handleEdit() {
    dispatch('edit', command);
  }

  function handleDelete() {
    dispatch('delete', command);
  }

  // Get command type icon and variant
  $: typeConfig = {
    'stream': { icon: Code, variant: 'default', description: 'Streaming output' },
    'ssh': { icon: Terminal, variant: 'secondary', description: 'SSH execution' },
    'terminal': { icon: Zap, variant: 'outline', description: 'Terminal spawn' }
  }[command.type] || { icon: Code, variant: 'outline', description: 'Unknown type' };

  // Format creation date
  $: createdDate = new Date(command.createdAt).toLocaleDateString();

  // Truncate long commands for display
  $: displayCmd = command.cmd.length > 50 
    ? command.cmd.substring(0, 50) + '...' 
    : command.cmd;
</script>

<Card class="transition-all duration-200 {isCurrentCommand ? 'ring-2 ring-orange-500 border-orange-500' : 'hover:shadow-md'}">
  <CardHeader class="pb-3">
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <svelte:component this={typeConfig.icon} class="w-4 h-4 text-primary" />
        </div>
        <div class="min-w-0 flex-1">
          <CardTitle class="text-base flex items-center gap-2">
            {command.name}
            {#if isCurrentCommand}
              <Loader2 class="w-3 h-3 animate-spin text-orange-600" />
            {/if}
          </CardTitle>
          <p class="text-xs text-muted-foreground mt-1 font-mono truncate">
            {displayCmd}
          </p>
        </div>
      </div>
      <Badge variant={typeConfig.variant} class="text-xs">
        {command.type}
      </Badge>
    </div>
  </CardHeader>

  <CardContent class="space-y-3">
    <!-- Command Details -->
    {#if command.description}
      <p class="text-sm text-muted-foreground">{command.description}</p>
    {/if}

    <!-- Full command (expandable for long commands) -->
    {#if command.cmd.length > 50}
      <details class="text-xs">
        <summary class="cursor-pointer text-muted-foreground hover:text-foreground">
          View full command
        </summary>
        <pre class="mt-2 p-2 bg-muted rounded text-xs font-mono whitespace-pre-wrap break-all">{command.cmd}</pre>
      </details>
    {/if}

    <!-- Metadata -->
    <div class="flex items-center justify-between text-xs text-muted-foreground">
      <span>Created: {createdDate}</span>
      <span class="capitalize">{typeConfig.description}</span>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-2 pt-2 border-t">
      <Button
        variant={isCurrentCommand ? "secondary" : "default"}
        size="sm"
        onclick={handleExecute}
        disabled={isExecuting}
        class="flex-1"
      >
        {#if isCurrentCommand}
          <Loader2 class="w-3 h-3 mr-1 animate-spin" />
          Running
        {:else}
          <Play class="w-3 h-3 mr-1" />
          Execute
        {/if}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onclick={handleEdit}
        disabled={isExecuting}
      >
        <Edit class="w-3 h-3" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onclick={handleDelete}
        disabled={isExecuting}
        class="text-destructive hover:text-destructive"
      >
        <Trash2 class="w-3 h-3" />
      </Button>
    </div>
  </CardContent>
</Card>
