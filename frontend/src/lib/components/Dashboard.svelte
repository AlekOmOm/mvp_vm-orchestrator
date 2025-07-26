<!--
  Dashboard Component
  
  Main dashboard that orchestrates all VM and command management components.
  Provides the primary interface for the VM orchestrator application.
-->

<script>
  import { onMount, onDestroy } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import ConnectionStatus from '$lib/components/ui/ConnectionStatus.svelte';
  
  // Enhanced services
  import { vmStore, vms, selectedVM, vmLoading, vmError } from '../stores/vmStore.js';
  import { WebSocketService } from '../services/WebSocketService.js';
  import { vmFormStore, vmFormHandlers } from '../stores/vmFormStore.js';
  
  // Components
  import VMForm from './vm/VMForm.svelte';
  import VMSidebar from './vm/VMSidebar.svelte';
  import CommandPanel from './command/CommandPanel.svelte';
  import LogViewer from './LogViewer.svelte';
  import JobHistory from './JobHistory.svelte';
  
  import {
    History,
    Play,
    Plus,
    AlertCircle
  } from 'lucide-svelte';

  // Component state
  let activeTab = 'execute';
  let wsService;
  let logLines = [];
  let connectionStatus = null; // Will be set to the store from wsService
  let errorMessage = '';

  // WebSocket reactive stores
  $: commands = wsService?.getCommands() || null;
  $: currentJob = wsService?.getCurrentJob() || null;

  /**
   * Initialize services on mount
   */
  onMount(async () => {
    console.log("🚀 Dashboard initializing...");

    try {
      // Load VMs
      await vmStore.loadVMs();
      console.log("✅ VMs loaded");

      // Initialize WebSocket service
      wsService = new WebSocketService();

      // Set up WebSocket event handlers
      setupWebSocketHandlers();

      // Connect WebSocket
      wsService.connect();
      console.log("✅ WebSocket service initialized");

    } catch (error) {
      console.error("🚨 Dashboard initialization error:", error);
      errorMessage = `Failed to initialize dashboard: ${error.message}`;
    }
  });

  /**
   * Dismiss error message
   */
  function dismissError() {
    errorMessage = '';
  }

  /**
   * Setup WebSocket event handlers
   */
  function setupWebSocketHandlers() {
    try {
      // Connection status - get the store from wsService
      connectionStatus = wsService.getConnectionStatus();

      // Job events
      wsService.on('job:started', (data) => {
        console.log("📋 Job started in Dashboard:", data);
        logLines = []; // Clear logs for new job
        errorMessage = ''; // Clear any previous errors
      });

      wsService.on('job:log', (data) => {
        logLines = [...logLines, {
          stream: data.stream,
          data: data.chunk,
          timestamp: data.timestamp || new Date().toISOString()
        }];
      });

      wsService.on('job:done', (data) => {
        console.log("✅ Job completed in Dashboard:", data);
      });

      wsService.on('job:error', (data) => {
        console.error("🚨 Job error in Dashboard:", data);
        errorMessage = `Job execution failed: ${data.error || 'Unknown error'}`;
      });

      // Connection error handling
      wsService.on('connect_error', (error) => {
        console.error("🚨 WebSocket connection error:", error);
        errorMessage = 'Failed to connect to server. Please check your connection.';
      });

      wsService.on('disconnect', (reason) => {
        console.warn("⚠️ WebSocket disconnected:", reason);
        if (reason === 'io server disconnect') {
          errorMessage = 'Server disconnected. Attempting to reconnect...';
        }
      });

    } catch (error) {
      console.error("🚨 Error setting up WebSocket handlers:", error);
      errorMessage = 'Failed to initialize WebSocket connection';
    }
  }

  /**
   * Cleanup on destroy
   */
  onDestroy(() => {
    console.log("🧹 Dashboard cleanup");
    wsService?.disconnect();
  });

  /**
   * Handle VM form submission
   */
  function handleVMFormSubmit(event) {
    vmFormHandlers.handleSubmit(event);
  }

  /**
   * Handle VM form cancellation
   */
  function handleVMFormCancel() {
    vmFormHandlers.handleCancel();
  }

  /**
   * Show add VM form
   */
  function showAddVMForm() {
    vmFormHandlers.handleShowCreate();
  }

  /**
   * Show edit VM form
   */
  function showEditVMForm(vm) {
    vmFormHandlers.handleShowEdit(vm);
  }



  /**
   * Handle command execution
   */
  function handleExecuteCommand(event) {
    const { commandGroup, commandName } = event.detail;
    errorMessage = ''; // Clear previous errors

    // Validation
    if (!$selectedVM) {
      errorMessage = "Please select a VM before executing commands";
      return;
    }

    if (!commands || !$commands[commandGroup]?.commands) {
      errorMessage = "Command group not found";
      return;
    }

    const command = $commands[commandGroup].commands.find(cmd => cmd.name === commandName);
    if (!command) {
      errorMessage = "Command not found";
      return;
    }

    if (!connectionStatus || $connectionStatus !== 'connected') {
      errorMessage = "Cannot execute command: WebSocket not connected";
      return;
    }

    try {
      console.log("🚀 Executing command:", command.cmd, "on VM:", $selectedVM.name);

      wsService.executeCommand({
        command: command.cmd,
        type: command.type || 'stream',
        vmId: $selectedVM.id,
        hostAlias: getSSHHostAlias($selectedVM)
      });

      // Set a timeout for command execution feedback
      setTimeout(() => {
        if (logLines.length === 0) {
          console.warn("⚠️ No output received within 5 seconds");
        }
      }, 5000);

    } catch (error) {
      console.error("🚨 Command execution error:", error);
      errorMessage = `Failed to execute command: ${error.message}`;
    }
  }

  /**
   * Handle job retry
   */
  function handleRetryJob(event) {
    const job = event.detail;
    errorMessage = ''; // Clear previous errors

    // Validation
    if (!$selectedVM) {
      errorMessage = "Please select a VM before retrying the job";
      return;
    }

    if (!job?.command) {
      errorMessage = "Cannot retry job: missing command information";
      return;
    }

    if (!connectionStatus || $connectionStatus !== 'connected') {
      errorMessage = "Cannot retry job: WebSocket not connected";
      return;
    }

    try {
      console.log("🔄 Retrying job:", job.id, "with command:", job.command);

      wsService.executeCommand({
        command: job.command,
        type: job.type || 'stream',
        vmId: $selectedVM.id,
        hostAlias: getSSHHostAlias($selectedVM)
      });

      // Switch to execute tab to show the retry
      activeTab = 'execute';

    } catch (error) {
      console.error("� Job retry error:", error);
      errorMessage = `Failed to retry job: ${error.message}`;
    }
  }

  /**
   * Get SSH host alias for a VM
   */
  function getSSHHostAlias(vm) {
    if (vm.sshHost) {
      return vm.sshHost;
    }

    const vmNameToSSHHost = {
      'prometheus-vm': 'prometheus',
      'grafana-vm': 'grafana',
      'grafana-db-vm': 'grafana-db'
    };

    return vmNameToSSHHost[vm.name] || vm.name;
  }
</script>

<div class="h-screen flex flex-col bg-gray-50">
  <!-- Header -->
  <header class="bg-white border-b border-gray-200 px-6 py-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <h1 class="text-2xl font-bold text-gray-900">VM Orchestrator</h1>
        
        <!-- Connection Status -->
        <ConnectionStatus {connectionStatus} />
      </div>

      <!-- VM Management -->
      <div class="flex items-center space-x-4">
        {#if $selectedVM}
          <span class="text-sm text-gray-600">
            Selected: <strong>{$selectedVM.name}</strong>
          </span>
        {/if}
        
        <Button on:click={showAddVMForm} size="sm">
          <Plus class="w-4 h-4 mr-2" />
          Add VM
        </Button>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Sidebar -->
    <VMSidebar
      vms={$vms}
      selectedVM={$selectedVM}
      loading={$vmLoading}
      error={$vmError}
      on:vm-select={(e) => vmStore.selectVM(e.detail)}
      on:vm-edit={(e) => showEditVMForm(e.detail)}
    />

    <!-- Main Panel -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Tabs -->
      <div class="bg-white border-b border-gray-200">
        <nav class="flex space-x-8 px-6">
          <button
            class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'execute' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
            on:click={() => activeTab = 'execute'}
          >
            <Play class="w-4 h-4 inline mr-2" />
            Execute
          </button>
          
          <button
            class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
            on:click={() => activeTab = 'history'}
          >
            <History class="w-4 h-4 inline mr-2" />
            History
          </button>
        </nav>
      </div>

      <!-- Error Message Display -->
      {#if errorMessage}
        <div class="px-6 py-2">
          <Alert variant="destructive">
            <AlertCircle class="h-4 w-4" />
            <AlertDescription class="flex items-center justify-between">
              <span>{errorMessage}</span>
              <Button variant="ghost" size="sm" on:click={dismissError} class="ml-2 h-auto p-1">
                ✕
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      {/if}

      <!-- Tab Content -->
      <div class="flex-1 overflow-hidden">
        {#if activeTab === 'execute'}
          <div class="h-full flex">
            <!-- Command Panel -->
            <div class="w-1/3 border-r border-gray-200">
              <CommandPanel
                selectedVM={$selectedVM}
                commands={commands ? $commands : {}}
                currentJob={currentJob ? $currentJob : null}
                on:execute-command={handleExecuteCommand}
              />
            </div>

            <!-- Log Viewer -->
            <div class="flex-1">
              <LogViewer
                {logLines}
                currentJob={currentJob ? $currentJob : null}
              />
            </div>
          </div>
        {:else if activeTab === 'history'}
          <JobHistory
            jobs={wsService?.getJobs()}
            on:retry-job={handleRetryJob}
          />
        {/if}
      </div>
    </main>
  </div>
</div>

<!-- VM Form Dialog -->
<Dialog bindopen={$vmFormStore.showForm}>
  <DialogContent class="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>
        {$vmFormStore.editingVM ? 'Edit VM' : 'Add New VM'}
      </DialogTitle>
    </DialogHeader>

    <VMForm
      vm={$vmFormStore.editingVM}
      loading={$vmLoading}
      error={$vmError}
      onsubmit={handleVMFormSubmit}
      oncancel={handleVMFormCancel}
    />
  </DialogContent>
</Dialog>
