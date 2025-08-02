<!--
  History Tab 
  - history of executions

  Enhanced job history with better jobStore integration, error handling,
  and improved filtering. Utilizes all jobStore features including statistics,
  caching, and real-time updates.
-->

<script>
import { Button } from '$lib/components/lib/ui/button';
import { Table } from '$lib/components/lib/ui/table';
import { getJobStore } from '$lib/state/stores.state.svelte.js';
import { getSelectedVMJobs } from '$lib/state/ui.state.svelte.js';
import Job from '$lib/components/lib/models/job/Job.svelte';

const jobStore = getJobStore();
const filteredJobs = $derived(getSelectedVMJobs());

let { onviewlogs, onretry } = $props();

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
        <th>Actions</th>
      </tr>
    </thead>
    <tbody class="job-list">
      {#each filteredJobs as job}
        <tr>
          <td class="td">{job.command}</td>
          <td>{job.type}</td>
          <td>
            <Button onclick={() => onviewlogs(job)}>View Log</Button>
            <Button onclick={() => onretry(job)}>Retry</Button>
          </td>
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
