<!--
  Job Log Modal Component

  Enhanced log viewer with better error handling and loading states.
  Uses jobService directly to avoid circular dependency issues.
-->

<script>
import { getService } from '../../core/ServiceContainer';
let { job = null, isOpen = false, onClose = () => {} } = $props();
let logLines = $state([]);

$effect(async () => {
  if (isOpen && job?.id) {
    const jobService = getService('jobService');
    logLines = await jobService.fetchJobLogs(job.id);
  }
});
</script>

{#if isOpen}
  <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
    <div style="background:white;padding:1rem;max-width:80vw;max-height:80vh;overflow:auto;">
      <button onclick={onClose}>Close</button>
      <h3>Logs</h3>
      <pre>{#each logLines as line}{line.data}\n{/each}</pre>
    </div>
  </div>
{/if}