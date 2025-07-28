<script>
  import { onMount } from 'svelte';
  import { storesContainer } from '$lib/stores/StoresContainer.js';
  import Log from './log/Log.svelte';

  let { class: className = '' } = $props();

  let logStore;
  let jobStore;
  let currentJob = $state(null);
  let logLines = $state([]);

  onMount(async () => {
    try {
      logStore = await storesContainer.get('logStore');
      jobStore = await storesContainer.get('jobStore');

      $effect(() => {
        if (jobStore) {
          const state = jobStore.getValue();
          currentJob = state.currentJob;
        }
        if (logStore && currentJob) {
          logLines = logStore.getLogLinesForJob(currentJob.id);
        } else {
          logLines = [];
        }
      });
    } catch (error) {
      console.error('Failed to initialize stores:', error);
    }
  });


</script>

<Log {logLines} {className} />