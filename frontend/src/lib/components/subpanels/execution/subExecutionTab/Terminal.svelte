<script>
  // state
  import { getJobStore } from '$lib/state/stores.state.svelte.js';
  import { getLogLines } from '$lib/state/ui.state.svelte.js';
  // model
  import Log from '$lib/components/lib/models/log/Log.svelte';

  let { class: className = '' } = $props();

  const jobStore = $derived(getJobStore());
  const currentJob = $derived(jobStore.currentJob);
  let logLines = $derived(getLogLines());

  console.log('[Terminal] logLines:', logLines);

  $effect(() => {
    if (currentJob) {

      logLines = jobStore.getLogLinesForJob(currentJob.id);
      console.log('[Terminal] logLines:', logLines);
    }
  });

</script>

<Log {logLines} {className} class="min-h-[30vh]"/>
