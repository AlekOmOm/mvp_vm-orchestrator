<script>
  import { getService } from '$lib/core/ServiceContainer.js';
  
  let { class: className = '' } = $props();
  
  const jobService = getService('jobService');
  const logLinesStore = jobService.getLogLines();
  const currentJobStore = jobService.getCurrentJob();
  let logLines = $derived($logLinesStore);
  let isRunning = $derived(!!$currentJobStore);
  
  // Auto-scroll to bottom when new logs arrive
  let logContainer;
  $effect(() => {
    if (logLines.length > 0 && logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  });
</script>

<div bind:this={logContainer} class="font-mono text-sm overflow-y-auto {className}">
  {#each logLines as line}
    <div class="whitespace-pre-wrap {line.stream === 'stderr' ? 'text-red-600' : ''}">
      {line.data}
    </div>
  {/each}
  
  {#if isRunning}
    <div class="text-muted-foreground animate-pulse">● Running...</div>
  {/if}
</div> 
