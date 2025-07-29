<!--
  VM Management Panel - Simplified
-->

<script>
  import { getVMStore } from '$lib/state/stores.state.svelte.js';
  import { useStore } from '$lib/composables/useStore.svelte.js';
  import VMSidebar from './VMSidebar.svelte';

  const vmStore = getVMStore();
  const { value: vmState } = useStore(vmStore);
  
  const vms = $derived(vmState.vms);
  const loading = $derived(vmState.loading);
  const error = $derived(vmState.error);

  async function handleRefreshVMs() {
    await vmStore.loadVMs();
  }
</script>

<div class="h-full flex flex-col">
  <header class="p-4 border-b">
    <h2 class="text-lg font-semibold">Virtual Machines</h2>
    <button onclick={handleRefreshVMs}>Refresh</button>
  </header>

  <div class="flex-1 overflow-hidden">
    <VMSidebar {loading} {error} />
  </div>
</div>
