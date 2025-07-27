<script>
  import Panel from '../ui/Panel.svelte';
  import ExecutionHeader from './header/ExecutionHeader.svelte';
  import ExecutionAlert from './alerts/ExecutionAlert.svelte';
  import CommandExecutionView from './commands/CommandExecutionView.svelte';
  import LogViewer from '../LogViewer.svelte';
  import JobHistory from '../job/JobHistory.svelte';
  import { selectedVM } from '../../stores/vmStore.js';
  import { getService } from '../../core/ServiceContainer.js';
  import { Clock } from 'lucide-svelte';

  let { ontabchanged, oncommandexecute } = $props();

  const jobService = getService('jobService');

  let activeTab = $state('execute');
  let currentAlert = $state(null);

  const currentJobStore = jobService.getCurrentJob();
  let currentJob = $derived($currentJobStore);

  function handleTabChange(event) {
    activeTab = event.tab;
    ontabchanged?.(event);
  }

  function handleCommandExecute(command) {
    oncommandexecute?.(command);
  }

  function handleAlert(alert) {
    currentAlert = alert;
  }

  function handleAlertDismiss() {
    currentAlert = null;
  }

  function handleJobRetry(jobData) {
    oncommandexecute?.(jobData);
  }
</script>

<Panel variant="main" class="h-full flex flex-col bg-card">
  <ExecutionHeader {activeTab} ontabchange={handleTabChange} />
  <ExecutionAlert alert={currentAlert} ondismiss={handleAlertDismiss} />
  
  <div class="flex-1 overflow-hidden">
    {#if activeTab === 'execute'}
      <div class="h-full flex flex-col">
        <CommandExecutionView oncommandexecute={handleCommandExecute} onalert={handleAlert} />
        <div class="flex-1 overflow-hidden">
          <LogViewer />
        </div>
      </div>
    {:else}
      <JobHistory selectedVM={$selectedVM} onretryjob={handleJobRetry} />
    {/if}
  </div>

  {#if currentJob}
    <div class="border-t bg-muted px-6 py-3 text-sm text-muted-foreground flex justify-between">
      <div class="flex items-center gap-2">
        <Clock class="w-4 h-4 text-muted-foreground" />
        Running: <code class="font-mono">{currentJob.command}</code>
      </div>
      <span class="text-xs text-muted-foreground">
        Started: {new Date(currentJob.startedAt ?? Date.now()).toLocaleTimeString()}
      </span>
    </div>
  {/if}
</Panel>
