<script>
import { Badge } from '$lib/components/lib/ui/badge';
import { Terminal } from 'lucide-svelte';
import { getService } from '../../../../core/ServiceContainer.js';
import { getSelectedVM } from '../../../../state/ui.state.svelte.js';
import ExecutionTabs from './ExecutionTabs.svelte';

let { activeTab, ontabchange } = $props();

const selectedVM = $derived(getSelectedVM());

const jobService = getService('jobService');
let currentJob = $derived(jobService.getCurrentJob());
let isExecuting = $derived(!!currentJob);

function handleChange(e) {
  ontabchange?.(e);
}
</script>

<div class="border-b bg-muted">
  <div class="flex items-center justify-between px-6 py-3">
    <ExecutionTabs {activeTab} onchange={handleChange} />
    <div class="flex items-center space-x-3">
      {#if isExecuting}
        <Badge variant="secondary" class="flex items-center gap-1">
          <Terminal class="w-3 h-3" /> Executing
        </Badge>
      {/if}
      {#if selectedVM}
        <Badge variant="outline" class="text-xs">{selectedVM.name}</Badge>
      {:else}
        <Badge variant="outline" class="text-xs text-muted-foreground">No VM Selected</Badge>
      {/if}
    </div>
  </div>
</div>
