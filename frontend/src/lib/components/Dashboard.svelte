<!--
  Dashboard Component
-->

<script>
  import { onMount } from 'svelte';
  import { initializeServices } from '../core/ServiceContainer.js';
  import { vmStore } from '../stores/vmStore.js';
  import VMManagementPanel from './vm/VMManagementPanel.svelte';
  import ExecutionPanel from './execution/ExecutionPanel.svelte';

  let errorMessage = $state('');

  onMount(async () => {
    try {
      console.log('🚀 Initializing Dashboard...');
      await initializeServices();
      await vmStore.loadVMs();
      console.log('✅ Dashboard initialized');
    } catch (error) {
      console.error('❌ Dashboard initialization failed:', error);
      errorMessage = error.message;
    }
  });

  function handleVMSelected(vm) {
    console.log('VM selected in Dashboard:', vm);
    // VM selection is handled by vmStore in VMManagementPanel
  }

  function handleCommandExecute(data) {
    console.log('Command executed:', data);
  }
</script>

<div class="h-screen flex flex-col bg-muted/30">
  <header class="border-b bg-background px-6 py-4">
    <h1 class="text-2xl font-bold">VM Orchestrator</h1>
  </header>

  <div class="flex-1 flex overflow-hidden">
    <VMManagementPanel onvmselected={handleVMSelected} />
    <ExecutionPanel oncommandexecute={handleCommandExecute} />
  </div>

  {#if errorMessage}
    <div class="p-4 bg-red-50 border-t border-red-200">
      <p class="text-red-700">{errorMessage}</p>
    </div>
  {/if}
</div>
