<script>
  import { getService } from '$lib/core/ServiceContainer.js';
  import Log from '$lib/components/lib/models/log/Log.svelte';

  let { class: className = '' } = $props();

  const commandExecutor = getService("commandExecutor");
  
  // Direct access to real-time WebSocket state via runes
  const logLines = $derived(commandExecutor.getLogLines()());
  const currentJob = $derived(commandExecutor.getCurrentJob()());
  const isExecuting = $derived(commandExecutor.getIsExecuting()());

  console.log('[Terminal] Real-time logs:', logLines?.length || 0);
</script>

<Log {logLines} {className} class="min-h-[30vh]"/>

{#if isExecuting}
  <div class="text-sm text-gray-500 mt-2">
    Executing: {currentJob?.command}...
  </div>
{/if}
