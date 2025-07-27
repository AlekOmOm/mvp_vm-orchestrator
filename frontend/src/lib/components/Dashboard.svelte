<!--
  Dashboard Component
-->

<script>
  import ThemeToggle from './ui/ThemeToggle.svelte';
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

<div class="h-screen flex flex-col bg-background">
  <header class="border-b border-border bg-card px-6 py-4 flex justify-between items-center">
    <h1 class="text-2xl font-bold text-card-foreground">VM Orchestrator</h1>
    <ThemeToggle class="fixed top-4 right-4" />
  </header>

  <div class="flex-1 flex overflow-hidden">
    <VMManagementPanel onvmselected={handleVMSelected} />
    <ExecutionPanel oncommandexecute={handleCommandExecute} />
  </div>

  {#if errorMessage}
    <div class="p-4 bg-destructive/10 border-t border-destructive/20">
      <p class="text-destructive">{errorMessage}</p>
    </div>
  {/if}
</div>
