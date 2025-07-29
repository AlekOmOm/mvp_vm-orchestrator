<!--
  Dashboard Component - Pure Layout
-->

<script>
  import Panel from '$lib/components/ui/Panel.svelte';
  import VMManagementPanel from './vm/VMManagementPanel.svelte';
  import ExecutionPanel from './execution/ExecutionPanel.svelte';
  import ThemeToggle from './ui/ThemeToggle.svelte';

  let error = $state(null);
</script>

<div class="h-screen flex flex-col bg-background">
  <header class="border-b bg-card px-6 py-4 flex justify-between items-center">
    <h1 class="text-2xl font-bold">VM Orchestrator</h1>
    <ThemeToggle />
  </header>

  <div class="flex-1 overflow-hidden flex">
    <Panel variant="sidebar">
      <VMManagementPanel />
    </Panel>
    <Panel variant="main">
      <ExecutionPanel />
    </Panel>
  </div>

  {#if error}
    <div class="border-t bg-destructive/10 px-6 py-2 text-sm text-destructive">
      Error: {error}
    </div>
  {/if}
</div>
