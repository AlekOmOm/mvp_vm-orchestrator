<!--
  History Tab 
  - history of executions using jobStore integration
-->

<script>
import { Card, CardContent } from '$lib/components/lib/ui/card';
import { Clock } from 'lucide-svelte';
import { getJobStore } from '$lib/state/stores.state.svelte.js';
import Job from '$lib/components/lib/models/job/Job.svelte';

const jobStore = $derived(getJobStore());
const jobs = $derived(jobStore?.jobs || []);

// Load jobs on mount and add debugging
$effect(() => {
  if (jobStore) {
    console.log("🔍 HistoryTab: Loading jobs, current count:", jobs.length);
    jobStore.loadJobs().then(() => {
      console.log("✅ HistoryTab: Jobs loaded, new count:", jobStore.jobs?.length || 0);
    });
  }
});

// Debug job changes
$effect(() => {
  console.log("📊 HistoryTab: Jobs updated:", jobs.length, jobs);
});
</script>

<div class="p-4 space-y-4">
  {#if jobs.length === 0}
    <Card>
      <CardContent class="p-8 text-center text-muted-foreground">
        <Clock class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <h3 class="text-lg font-medium mb-2">No Execution History</h3>
        <p>Command executions will appear here once you start running commands.</p>
      </CardContent>
    </Card>
  {:else}
    <div class="space-y-3">
      {#each jobs as job (job.id)}
        <Job jobId={job.id} />
      {/each}
    </div>
  {/if}
</div>
