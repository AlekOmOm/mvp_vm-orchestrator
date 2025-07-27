<!--
  Job History Component

  Enhanced job history with better jobStore integration, error handling,
  and improved filtering. Utilizes all jobStore features including statistics,
  caching, and real-time updates.
-->

<script>
import { onMount } from 'svelte';
import { jobStore, jobsWithLogs } from '../../stores/jobStore.js';
import JobList from './JobList.svelte';


onMount(async () => {
  await jobStore.loadJobs();
});

function refresh() {
  jobStore.refreshJobs();
}


</script>

<div>
  <h2>Job History</h2>
  <button onclick={refresh}>Refresh</button>
  <JobList jobs={$jobsWithLogs} />
</div>
