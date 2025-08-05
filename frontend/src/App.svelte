<script>
  import Dashboard from '$lib/components/Dashboard.svelte';
  import './styles/styles.css';
  import { initializeStoresData } from '$lib/state/stores.state.svelte.js';
  import { initializedUIState } from '$lib/state/ui.state.svelte.js';
  import { getVMStore } from '$lib/state/stores.state.svelte.js';
  import { onMount } from 'svelte';
  import { initializeServices } from '$lib/core/ServiceContainer.js';

  let ready = $state(false);
  
  onMount(async () => {
    console.log("🚀 [App.svelte] Starting initialization...");
    
    await initializeServices();
    await initializeStoresData();
    
    // Get loaded VMs from store and initialize UI state
    const vmStore = getVMStore();
    const loadedVMs = vmStore.getVMs();
    await initializedUIState(loadedVMs);
    ready = true;
    
    console.log("✅ [App.svelte] Initialization complete");
  });
</script>

<main class="min-h-screen bg-background text-foreground">
  {#if ready}
    <Dashboard />
  {/if}
</main>
