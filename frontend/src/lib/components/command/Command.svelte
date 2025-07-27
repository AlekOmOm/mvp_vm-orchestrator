<script>
import { Button } from '$lib/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
import { Badge } from '$lib/components/ui/badge';
import { Terminal, Edit, Trash2, Play, Loader2, Code, Zap } from 'lucide-svelte';

let { command, isExecuting = false, isCurrentCommand = false, onexecute, onedit, ondelete } = $props();

function handleExecute() { onexecute?.(command); }
function handleEdit() { onedit?.(command); }
function handleDelete() { ondelete?.(command); }

let typeConfig = {
  stream: { icon: Code, variant: 'default', description: 'Streaming output' },
  ssh: { icon: Terminal, variant: 'secondary', description: 'SSH execution' },
  terminal: { icon: Zap, variant: 'outline', description: 'Terminal spawn' }
}[command.type] || { icon: Code, variant: 'outline', description: 'Unknown type' };

let createdDate = new Date(command.createdAt).toLocaleDateString();
let displayCmd = command.cmd.length > 50 ? command.cmd.substring(0, 50) + '...' : command.cmd;
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

      <Button variant="outline" size="sm" onclick={handleDelete} disabled={isExecuting} class="text-destructive hover:text-destructive">
        <Trash2 class="w-3 h-3" />
      </Button>
    </div>
  </CardContent>
</Card>


