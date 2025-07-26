<script>
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Terminal, Play, Loader2 } from 'lucide-svelte';

  export let commands = {};
  export let currentJob = null;

  const dispatch = createEventDispatcher();

  function executeCommand(commandGroup, commandName) {
    if (currentJob) return;
    dispatch('execute', { commandGroup, commandName });
  }

  $: isExecuting = !!currentJob;
  $: commandGroups = Object.keys(commands);
</script>

<div class="h-full overflow-y-auto p-4 space-y-4">
  {#if commandGroups.length === 0}
    <div class="flex items-center justify-center h-32 text-muted-foreground">
      <Loader2 class="w-4 h-4 mr-2 animate-spin" />
      Loading commands...
    </div>
  {:else}
    {#each commandGroups as groupName}
      {@const group = commands[groupName]}
      <Card>
        <CardHeader class="pb-3">
          <div class="flex items-center justify-between">
            <CardTitle class="text-lg">{groupName}</CardTitle>
            <Badge variant="outline" class="text-xs">
              {#if group.type === 'local'}
                <Terminal class="w-3 h-3 mr-1" />
              {:else}
                <span class="mr-1">🔗</span>
              {/if}
              {group.type}
            </Badge>
          </div>
          <CardDescription>{group.description}</CardDescription>
        </CardHeader>
        
        <CardContent class="pt-0">
          <div class="space-y-2">
            {#each group.commands as command}
              <Button
                variant="outline"
                size="sm"
                class="w-full justify-start h-auto p-3"
                disabled={isExecuting}
                onclick={() => executeCommand(groupName, command.name)}
              >
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-2">
                    {#if isExecuting && currentJob?.command?.includes(command.name)}
                      <Loader2 class="w-4 h-4 animate-spin" />
                    {:else}
                      <Play class="w-4 h-4" />
                    {/if}
                    <span class="font-medium">{command.name}</span>
                  </div>
                  <span class="text-xs text-muted-foreground">{command.description}</span>
                </div>
              </Button>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/each}
  {/if}

  {#if isExecuting}
    <Card class="border-orange-200 bg-orange-50">
      <CardContent class="pt-4">
        <div class="flex items-center gap-2 text-orange-700">
          <Loader2 class="w-4 h-4 animate-spin" />
          <span class="font-medium">Executing:</span>
          <code class="text-sm">{currentJob.command}</code>
        </div>
      </CardContent>
    </Card>
  {/if}
</div> 