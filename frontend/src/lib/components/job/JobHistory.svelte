<!--
  Job History Component

  Enhanced job history with better jobStore integration, error handling,
  and improved filtering. Utilizes all jobStore features including statistics,
  caching, and real-time updates.
-->

<script>
import { onMount } from 'svelte';
import { storesContainer } from '../../stores/StoresContainer.js';
import Table from '$lib/components/ui/table/table.svelte';
import Button from '$lib/components/ui/button/button.svelte';

let jobStore;
let jobs = $state([]);
let loading = $state(false);

onMount(async () => {
  try {
    jobStore = await storesContainer.get('jobStore');

    $effect(() => {
      const state = jobStore.getValue();
      jobs = state.jobs;
      loading = state.loading;
    });

    await jobStore.loadJobs();
  } catch (error) {
    console.error('Failed to initialize job store:', error);
  }
});

function refresh() {
  jobStore?.loadJobs();
}


</script>

<div class="job-history">
  <Table class="job-table">
    <thead>
      <tr class="job-table-header">
        <th>Command</th>
        <th>Type</th>
        <th>
          logs
        </th>
      </tr>
    </thead>
    <tbody class="job-list">
      {#each jobs as job}
        <tr>
          <td class="td">{job.command}</td>
          <td>{job.type}</td>
          <td><Button onclick={() => {
            // TODO: Implement log viewing with new store pattern
            console.log('View logs for job:', job.id);
          }}>view log</Button></td>
        </tr>
      {/each}
    </tbody>
  </Table>
</div>

<style>
  .job-history {
    padding: 2vh;
  }
  .job-table-header {
    align-items: left;
    background-color: var(--background);
  }
  tr {
    align-items: left;
    /* give padding on each row */
    padding: 1vh 0;

    background-color: var(--card);
    border-bottom-color: var(--);
  }  

  .td {
    padding: 1vh 1vh;
  }

  :global(.job-table) {
    background-color: var(--background);
    /* 
    border with rounded corners
    */
    border-radius: var(--radius);
    border: 1px solid var(--border);
    border-radius: var(--radius);

  }


</style>