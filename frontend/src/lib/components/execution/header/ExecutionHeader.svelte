<script>
import { Badge } from '$lib/components/ui/badge';
import { onMount } from 'svelte';
import { Terminal } from 'lucide-svelte';
import { getService } from '../../../core/ServiceContainer.js';
import { storesContainer } from '../../../stores/StoresContainer.js';
import { createVMDerivedStores } from '../../../stores/vmStore.js';
import ExecutionTabs from './ExecutionTabs.svelte';

let { activeTab, ontabchange } = $props();

let vmStore;
let selectedVMStore;

onMount(async () => {
  try {
    vmStore = await storesContainer.get('vmStore');
    const { selectedVM } = createVMDerivedStores(vmStore);
    selectedVMStore = selectedVM;
  } catch (error) {
    console.error('Failed to initialize ExecutionHeader stores:', error);
  }
});

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
      {#if $selectedVMStore}
        <Badge variant="outline" class="text-xs">{$selectedVMStore.name}</Badge>
      {:else}
        <Badge variant="outline" class="text-xs text-muted-foreground">No VM Selected</Badge>
      {/if}
    </div>
  </div>
</div> 