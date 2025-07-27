<script>
import { Select } from '$lib/components/ui/select';
let { viewMode, statusFilter, viewOptions = [], statusOptions = [] } = $props();
</script>

<div class="flex gap-2 flex-wrap">
  <div class="flex items-center gap-2">
    <Select bind:value={viewMode} class="w-32">
      {#each viewOptions as option}
        <option value={option.value} disabled={option.disabled}>{option.label}</option>
      {/each}
    </Select>
  </div>
  <Select bind:value={statusFilter} class="w-32">
    {#each statusOptions as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </Select>
</div> 