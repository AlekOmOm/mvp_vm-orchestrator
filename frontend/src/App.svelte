<script>
  import Dashboard from './lib/components/Dashboard.svelte';
  import './styles/styles.css';
  import { initStores } from '$lib/state/stores.state.svelte.js';
  import { onMount } from 'svelte';

  let ready = $state(false);
  onMount(async () => {
    await initStores();   // wait for container + DI
    ready = true;
  });
</script>

<main class="min-h-screen bg-background text-foreground">
  {#if ready}
    <Dashboard />
  {/if}
</main>
