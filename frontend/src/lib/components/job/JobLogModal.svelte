<script>
import Modal from '$lib/components/ui/Modal.svelte';
import { logStore } from '$lib/stores/logStore.js';
import { onMount, effect } from 'svelte';

let { job = null, isOpen = false, onClose = () => {} } = $props();

effect(() => {
    if (isOpen && job?.id) {
        logStore.fetchAndSetLogs(job.id);
    }
});

let logLines = $derived.by(() => {
    if (!job) return [];
    return logStore.getLogLinesForJob(job.id) || [];
});
</script>

<Modal {isOpen} {onClose} title={job ? `Logs – ${job.command?.slice(0,40)}` : 'Logs'} size="lg">
  <div class="p-4 font-mono text-sm overflow-y-auto max-h-[80vh] space-y-1">
    {#if logLines.length > 0}
        {#each logLines as line}
          <div class="whitespace-pre-wrap {line.stream === 'stderr' ? 'text-red-600' : ''}">
            <span class="text-xs text-muted-foreground mr-2">
              {new Date(line.timestamp).toLocaleTimeString()}
            </span>
            {line.data}
          </div>
        {/each}
    {:else}
      <div class="text-center text-muted-foreground py-8">No logs available for job {job?.id}</div>
    {/if}
  </div>
</Modal> 