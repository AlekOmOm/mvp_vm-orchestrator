<script>
  import { afterUpdate } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Badge } from '$lib/components/ui/badge';
  import { ArrowDown, RotateCcw, Trash2, Terminal } from 'lucide-svelte';

  export let currentJob = null;
  export let logLines = [];

  let logContainer;
  let autoScroll = true;

  afterUpdate(() => {
    if (autoScroll && logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  });

  function handleScroll() {
    if (!logContainer) return;
    const { scrollTop, scrollHeight, clientHeight } = logContainer;
    autoScroll = scrollTop + clientHeight >= scrollHeight - 50;
  }

  function clearLogs() {
    logLines = [];
  }

  function toggleAutoScroll() {
    autoScroll = !autoScroll;
    if (autoScroll && logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }

  function scrollToBottom() {
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
      autoScroll = true;
    }
  }

  $: hasLogs = logLines.length > 0;
  $: isRunning = !!currentJob;
</script>

<div class="h-full flex flex-col">
  <div class="p-4 border-b">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        {#if currentJob}
          <Badge variant="default" class="animate-pulse">
            <Terminal class="w-3 h-3 mr-1" />
            Running
          </Badge>
          <code class="text-sm bg-muted px-2 py-1 rounded">{currentJob.command}</code>
        {:else}
          <span class="text-muted-foreground">No active job</span>
        {/if}
      </div>

      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          class={autoScroll ? "bg-primary/10" : ""}
          onclick={toggleAutoScroll}
        >
          <ArrowDown class="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onclick={scrollToBottom}
          disabled={!hasLogs}
        >
          <RotateCcw class="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onclick={clearLogs}
          disabled={!hasLogs}
        >
          <Trash2 class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>

  <div class="flex-1 relative">
    <div 
      bind:this={logContainer}
      onscroll={handleScroll}
      class="h-full overflow-y-auto"
    >
      {#if logLines.length === 0}
        <div class="flex items-center justify-center h-full text-muted-foreground">
          {#if isRunning}
            <div class="text-center">
              <Terminal class="w-8 h-8 mx-auto mb-2 animate-pulse" />
              <p>Waiting for output...</p>
            </div>
          {:else}
            <div class="text-center">
              <Terminal class="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Execute a command to see output</p>
            </div>
          {/if}
        </div>
      {:else}
        <div class="p-4 font-mono text-sm space-y-1">
          {#each logLines as line, i}
            <div 
              class="flex items-start gap-3 py-1"
              class:text-red-600={line.stream === 'stderr'}
              class:text-blue-600={line.stream === 'system'}
              class:text-orange-600={line.stream === 'error'}
            >
              <Badge 
                variant="outline" 
                class={`text-xs px-1 py-0 h-auto min-w-[60px] justify-center ${
                  line.stream === 'stderr' ? 'border-red-200' :
                  line.stream === 'system' ? 'border-blue-200' :
                  line.stream === 'error' ? 'border-orange-200' : ''
                }`}
              >
                {line.stream}
              </Badge>
              <code class="flex-1 whitespace-pre-wrap break-all">
                {line.data}
              </code>
              <span class="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(line.timestamp).toLocaleTimeString()}
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div> 