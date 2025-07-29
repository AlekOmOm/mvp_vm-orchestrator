<script>
  import { onMount } from 'svelte';
  import { storesContainer } from '$lib/stores/StoresContainer.js';
  import Log from './log/Log.svelte';

  let { class: className = '' } = $props();

  let logStore = $state(null);
  let jobStore = $state(null);
  let currentJob = $state(null);
  let logLines = $state([]);

  // Set up reactive effects synchronously - subscribe to store changes
  $effect(() => {
    if (jobStore) {
      const unsubscribe = jobStore.subscribe((state) => {
        currentJob = state.currentJob;
      });
      return unsubscribe;
    }
  });

  $effect(() => {
    if (logStore && currentJob) {
      logLines = logStore.getLogLinesForJob(currentJob.id);
    } else {
      logLines = [];
    }
  });

  // Initialize stores asynchronously
  onMount(async () => {
    try {
      logStore = await storesContainer.get('logStore');
      jobStore = await storesContainer.get('jobStore');
    } catch (error) {
      console.error('Failed to initialize stores:', error);
    }
  });


</script>

<Log {logLines} {className} />