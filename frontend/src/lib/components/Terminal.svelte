<script>
  import { getService } from '$lib/core/ServiceContainer.js';
  import { logStore } from '$lib/stores/logStore.js';
  let { class: className = '' } = $props();
  
  const jobService = getService('jobService');
  const currentJobStore = jobService.getCurrentJob();
  let logLines = $derived.by(() => {
    const currentJob = $currentJobStore;
    // reactively depend on logStore state
    const _ = $logStore;
    if (currentJob) {
      return logStore.getLogLinesForJob(currentJob.id);
    }
    return [];
  });

  let logContainer;
  $effect(() => {
    if (logLines.length > 0 && logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  });
  $effect(() => {
    console.log('[Terminal] logLines length:', logLines.length, 'currentJob:', $currentJobStore);
  });
</script>

<div bind:this={logContainer} class="font-mono text-sm overflow-y-auto p-2 pl-4 mt-2 min-h-[120px] {className}">
  {#each logLines as line}
    <div class="whitespace-pre-wrap {line.stream === 'stderr' ? 'text-red-600' : ''}">
      {line.data}
    </div>
  {/each}
</div> 
