<!--
  Dashboard Component
-->

<script>
  import ThemeToggle from './ui/ThemeToggle.svelte';
  import { onMount } from 'svelte';
  import { initializeServices, serviceContainer } from '../core/ServiceContainer.js';
  import { storesContainer } from '../stores/StoresContainer.js';
  import { registerStores } from '../stores/storeRegistry.js';
  import VMManagementPanel from './vm/VMManagementPanel.svelte';
  import ExecutionPanel from './execution/ExecutionPanel.svelte';
  import ErrorMessage from './debug/ErrorMessage.svelte';

  let errorMessage = $state('');

  onMount(async () => {
    try {
      console.log('🚀 Initializing Dashboard...');
      await initializeServices();
      registerStores(serviceContainer);
      await storesContainer.initialize();
      
      // ✅ Trigger VM loading after store initialization
      const vmStore = await storesContainer.get('vmStore');
      await vmStore.loadVMs();
      console.log('✅ VMs loaded successfully');
      
      console.log('✅ Dashboard initialized');
    } catch (error) {
      console.error('❌ Dashboard initialization failed:', error);
      errorMessage = error.message;
    }
  });

  function handleVMSelected(vm) {
    console.log('VM selected in Dashboard:', vm);
  }

  function handleCommandExecute(data) {
    console.log('Command executed:', data);
  }
</script>

<div class="h-screen flex flex-col bg-background">
  <header class="border-b border-border bg-card px-6 py-4 flex justify-between items-center">
    <h1 class="text-2xl font-bold text-card-foreground">VM Orchestrator</h1>
    <ThemeToggle class="fixed top-4 right-4" />
  </header>

  <div class="content">
    <VMManagementPanel onvmselected={handleVMSelected} />
    <ExecutionPanel oncommandexecute={handleCommandExecute} />
  </div>

  <ErrorMessage errorMessage={errorMessage} />
</div>

<style>
  .content {
    flex: 1;
    overflow: hidden;
  }
</style>
