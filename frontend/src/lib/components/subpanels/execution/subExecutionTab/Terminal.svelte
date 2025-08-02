<script>
  import { getJobStore } from '$lib/state/stores.state.svelte.js';
  import Log from '$lib/components/lib/models/log/Log.svelte';

  let { class: className = '' } = $props();

  const jobStore = $derived(getJobStore());
  const currentJob = $derived(jobStore.currentJob);
  const logLines = $derived(jobStore.logLines);
</script>

<Log {logLines} {className} />
