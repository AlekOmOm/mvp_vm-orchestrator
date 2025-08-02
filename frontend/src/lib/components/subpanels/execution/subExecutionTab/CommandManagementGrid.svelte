<script>
import Command from '$lib/components/lib/models/command/Command.svelte';
import Grid from '$lib/components/lib/ui/Grid.svelte';

// Props - only data needed
let { commands = [] } = $props();
</script>

<Grid>
  {#each commands as command}
    <Command {command} />
  {/each}
</Grid>
