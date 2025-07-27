<script>
import Job from '../Job.svelte';
let { jobs = [], compact = false, onviewlogs = () => {}, onretry = () => {}, limit = 20 } = $props();
function handleView(job){ onviewlogs(job); }
function handleRetry(job){ onretry(job); }
</script>
<div class="space-y-2">
  {#each jobs as job (job.id)}
    <Job {job} {compact} onviewlogs={handleView} onretry={handleRetry} />
  {/each}
  {#if jobs.length >= limit}
    <div class="text-center pt-2"><p class="text-xs text-muted-foreground">Showing latest {limit} jobs</p></div>
  {/if}
</div> 