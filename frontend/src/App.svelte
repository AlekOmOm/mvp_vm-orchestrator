<script>
  import { onMount } from 'svelte';
  import { WebSocketService } from './lib/services/WebSocketService.js';
  import CommandPanel from './lib/components/CommandPanel.svelte';
  import LogViewer from './lib/components/LogViewer.svelte';
  import JobHistory from './lib/components/JobHistory.svelte';
  import ConnectionStatus from './lib/components/ConnectionStatus.svelte';
  
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Separator } from '$lib/components/ui/separator';

  let wsService;
  let connectionStatus;
  let commands;
  let currentJob;
  let logLines;
  let jobs;

  onMount(() => {
    wsService = new WebSocketService();
    
    connectionStatus = wsService.getConnectionStatus();
    commands = wsService.getCommands();
    currentJob = wsService.getCurrentJob();
    logLines = wsService.getLogLines();
    jobs = wsService.getJobs();
  });

  function handleExecuteCommand(event) {
    const { commandGroup, commandName } = event.detail;
    wsService.executeCommand(commandGroup, commandName);
  }

  function handleRefreshHistory() {
    wsService.loadJobHistory();
  }
</script>

<main class="min-h-screen bg-background">
  <header class="border-b bg-card">
    <div class="container mx-auto px-4 py-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-foreground">🚀 VM Orchestrator MVP</h1>
      {#if wsService}
        <ConnectionStatus status={$connectionStatus} />
      {/if}
    </div>
  </header>

  <div class="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-80px)]">
    
    <Card class="lg:row-span-2">
      <CardHeader>
        <CardTitle>Available Commands</CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        {#if wsService}
          <CommandPanel 
            commands={$commands} 
            currentJob={$currentJob}
            on:execute={handleExecuteCommand} 
          />
        {/if}
      </CardContent>
    </Card>

    <Card class="lg:col-span-2">
      <CardHeader>
        <CardTitle>Live Output</CardTitle>
        <Separator />
      </CardHeader>
      <CardContent class="p-0">
        {#if wsService}
          <LogViewer 
            currentJob={$currentJob} 
            logLines={$logLines} 
          />
        {/if}
      </CardContent>
    </Card>

    <Card class="lg:col-span-2">
      <CardHeader>
        <CardTitle>Job History</CardTitle>
        <Separator />
      </CardHeader>
      <CardContent class="p-0">
        {#if wsService}
          <JobHistory 
            jobs={$jobs} 
            on:refresh={handleRefreshHistory}
          />
        {/if}
      </CardContent>
    </Card>

  </div>
</main>
