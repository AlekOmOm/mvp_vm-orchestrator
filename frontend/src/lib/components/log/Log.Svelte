<script>
  let { job } = $props();
  let logLines = $derived(job.logLines);
  let logContainer;
  $effect(() => {
    if (logLines.length > 0 && logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  });
</script>

<div bind:this={logContainer} class="log-container">
  {#each logLines as line}
    <div class="whitespace-pre-wrap {line.stream === 'stderr' ? 'text-red-600' : ''}">
      {line.data}
    </div>
  {/each}
</div>



<style>
  .log-container {
    max-height: 30vh;
    background: #f9f9f9;
    font-family: monospace;
    font-size: 12px;
    overflow-y: auto;
    padding: 8px;
  }
</style> 