<script>
  import { derived } from 'svelte/store';
  import { Button } from '$lib/components/ui/button';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { Badge } from '$lib/components/ui/badge';
  import {
    Play,
    History,
    AlertCircle,
    Terminal,
    Clock
  } from 'lucide-svelte';

  // Execution Components
  import CommandPanel from '../command/CommandPanel.svelte';
  import LogViewer from '../LogViewer.svelte';
  import JobHistory from '../job/JobHistory.svelte';

  // Stores
  import { selectedVM } from '../../stores/vmStore.js';

  // Props
  let { wsService, logLines, errorMessage, ontabchanged, oncommandexecute, onclearerror } = $props();

  // Local state
  let activeTab = 'execute';

  // Reactive WebSocket stores
  let commands = $derived(wsService?.getCommands() || {});
  let currentJob = $derived(wsService?.getCurrentJob() || null);
  let isRunning = $derived(!!currentJob);

  /**
   * Handle tab switching
   */
  function setActiveTab(tab) {
    activeTab = tab;
    ontabchanged({ tab });
  }

  /**
   * Handle command execution
   */
  function handleCommandExecute(event) {
    oncommandexecute(event.detail);
  }

  /**
   * Handle job retry
   */
  function handleJobRetry(event) {
    oncommandexecute(event.detail); // Retry uses same handler as execute
  }

  /**
   * Clear error message
   */
  function clearError() {
    onclearerror();
  }
</script>

<div class="execution-panel h-full flex flex-col bg-white">
  <!-- header --------------------------------------------------------- -->
  <div class="border-b bg-gray-50">
    <div class="flex items-center justify-between px-6 py-3">
      <div class="flex items-center space-x-1">
        <Button
          variant={activeTab === 'execute' ? 'default' : 'ghost'}
          size="sm"
          on:click={() => setActiveTab('execute')}
          class="flex items-center gap-2"
        >
          <Play class="w-4 h-4" /> Execute
        </Button>

        <Button
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          size="sm"
          on:click={() => setActiveTab('history')}
          class="flex items-center gap-2"
        >
          <History class="w-4 h-4" /> History
        </Button>
      </div>

      <div class="flex items-center space-x-3">
        {#if isRunning}
          <Badge variant="secondary" class="flex items-center gap-1">
            <Terminal class="w-3 h-3" /> Executing
          </Badge>
        {/if}

        {#if $selectedVM}
          <Badge variant="outline" class="text-xs">{$selectedVM.name}</Badge>
        {:else}
          <Badge variant="outline" class="text-xs text-muted-foreground">
            No VM Selected
          </Badge>
        {/if}
      </div>
    </div>
  </div>

  <!-- error ----------------------------------------------------------- -->
  {#if errorMessage}
    <div class="p-4">
      <Alert variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription class="flex items-center">
          <span class="flex-1">{errorMessage}</span>
          <Button variant="outline" size="sm" on:click={clearError} class="ml-2">
            Dismiss
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  {/if}

  <!-- tabs ------------------------------------------------------------ -->
  <div class="flex-1 overflow-hidden">
    {#if activeTab === 'execute'}
      <div class="h-full flex flex-col">
        <!-- command panel -->
        <div class="border-b">
          <CommandPanel
            {commands}
            {currentJob}
            on:execute-command={handleCommandExecute}
          />
        </div>

        <!-- live logs -->
        <div class="flex-1 overflow-hidden">
          <LogViewer {logLines} {currentJob} />
        </div>
      </div>

    {:else}
      <!-- history -->
      <JobHistory
        selectedVM={$selectedVM}
        on:retry-job={handleJobRetry}
      />
    {/if}
  </div>

  <!-- footer ---------------------------------------------------------- -->
  {#if currentJob}
    <div class="border-t bg-gray-50 px-6 py-3 text-sm text-gray-600 flex justify-between">
      <div class="flex items-center gap-2">
        <Clock class="w-4 h-4 text-gray-500" />
        Running: <code class="font-mono">{currentJob.command}</code>
      </div>
      <span class="text-xs text-gray-500">
        Started: {new Date(currentJob.startedAt ?? Date.now()).toLocaleTimeString()}
      </span>
    </div>
  {/if}
</div>

<style>
  .execution-panel { min-height: 0; }
</style>