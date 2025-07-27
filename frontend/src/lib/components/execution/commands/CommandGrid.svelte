<script>
import Command from '../../command/Command.svelte';
import { getService } from '../../../core/ServiceContainer.js';

let { commands = [], isExecuting = false, onexecute, onedit, ondelete } = $props();

const jobService = getService('jobService');
let currentJob = $derived(jobService.getCurrentJob());

function handleExecute(cmd) { onexecute?.(cmd); }
function handleEdit(cmd) { onedit?.(cmd); }
function handleDelete(cmd) { ondelete?.(cmd); }
</script>

<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
  {#each commands as c}
    <Command
      command={c}
      {isExecuting}
      isCurrentCommand={currentJob?.command === c.cmd}
      onexecute={() => handleExecute(c)}
      onedit={() => handleEdit(c)}
      ondelete={() => handleDelete(c)}
    />
  {/each}
</div>