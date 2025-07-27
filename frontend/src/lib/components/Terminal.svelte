<script>
  import { getService } from '$lib/core/ServiceContainer.js';
  import { logStore } from '$lib/stores/logStore.js';
  import Log from './log/Log.svelte';
  // if loglines then small terminal and only show log line
  let { class: className = '' } = $props();

  const jobService = getService('jobService');
  const currentJobStore = jobService.getCurrentJob();
  let logLines = $derived.by(() => {
    const currentJob = $currentJobStore;
    // reactively depend on logStore state
    const _ = $logStore;
    if (currentJob) {
      return logStore.getLogLinesForJob(currentJob.id);
    }
    return [];
  });


</script>

<Log {logLines} {className} />