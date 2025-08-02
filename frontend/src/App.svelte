<script>
  import Dashboard from './lib/components/Dashboard.svelte';
  import './styles/styles.css';
  import { initializeStoresData } from '$lib/state/stores.state.svelte.js';
  import { initializedUIState } from '$lib/state/ui.state.svelte.js';
  import { onMount } from 'svelte';
  import { initializeServices } from '$lib/core/ServiceContainer.js';

  let ready = $state(false);
  onMount(async () => {
    await initializeStoresData();   // Single call handles everything
    await initializedUIState();
    await initializeServices();
    ready = true;
  });
</script>

<main class="min-h-screen bg-background text-foreground">
  {#if ready}
    <Dashboard />
  {/if}
</main>
