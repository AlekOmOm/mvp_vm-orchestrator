<script>
  import { logStore } from '../../stores/logStore.js';
  import { getService } from '../../core/ServiceContainer.js';
  import Log from '../log/Log.svelte';

  let { job } = $props();
  

  let showLogs = $state(false);
  let loading = $state(false);
  let lines = $state([]);

  async function toggleLogs() {
    // showLogModal
    
  }
</script>

<div class="job-simple">
  <div>
    <div class="title">{job.title || job.command?.slice(0,50)}</div>
    <div class="command">{job.command}</div>
  </div>
  <button onclick={toggleLogs}>{showLogs ? 'Hide' : 'View'} logs</button>
</div>


{#if showLogs}
  {#if loading}
    <div>Loading...</div>
  {:else}
  <Log {job} />
  {/if}
{/if}

<style>
.job-simple {
  border:1px solid #aaa;margin:6px 0;padding:6px;display:flex;justify-content:space-between;align-items:center;
}
.command {
  font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px;
}

</style>
