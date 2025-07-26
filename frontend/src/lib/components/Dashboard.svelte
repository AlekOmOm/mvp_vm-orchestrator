<!--
  Dashboard Component
  
  Simplified main dashboard that orchestrates specialized panels.
  Uses modular Svelte architecture with component composition.
-->

<script>
  import { onMount, onDestroy } from 'svelte';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { AlertCircle } from 'lucide-svelte';
  import ConnectionStatus from '$lib/components/ui/ConnectionStatus.svelte';
  
  // Services
  import { vmStore } from '../stores/vmStore.js';
  import { WebSocketService } from '../services/WebSocketService.js';
  
  // Specialized Panels
  import VMManagementPanel from './vm/VMManagementPanel.svelte';
  import ExecutionPanel from './execution/ExecutionPanel.svelte';

  // Dashboard state
  let wsService;
  let logLines = [];
  let connectionStatus = null;
  let errorMessage = '';

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
      setupWebSocketHandlers();
      wsService.connect();
      console.log("✅ WebSocket service initialized");

    } catch (error) {
      console.error("🚨 Dashboard initialization error:", error);
      errorMessage = `Failed to initialize dashboard: ${error.message}`;
    }
  });

  /**
   * Setup WebSocket event handlers
   */
  function setupWebSocketHandlers() {
    try {
      connectionStatus = wsService.getConnectionStatus();

      // Job events for log management
      wsService.on('job:started', (data) => {
        console.log("📋 Job started:", data);
        logLines = [];
        errorMessage = '';
      });

      wsService.on('job:log', (data) => {
        logLines = [...logLines, {
          stream: data.stream,
          data: data.chunk,
          timestamp: data.timestamp || new Date().toISOString()
        }];
      });

      wsService.on('job:done', (data) => {
        console.log("✅ Job completed:", data);
      });

      wsService.on('job:error', (data) => {
        console.error("🚨 Job error:", data);
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
   * Handle events from VM Management Panel
   */
  function handleVMEvent(data) {
    console.log("VM Event:", data);
  }

  /**
   * Handle command execution from ExecutionPanel
   */
  function handleExecuteCommand(data) {
    console.log("Execute Command:", data);
    wsService?.executeCommand(data);
  }



  /**
   * Handle tab change from ExecutionPanel
   */
  function handleTabChanged(data) {
    console.log("Tab Changed:", data.tab);
  }

  /**
   * Clear error message
   */
  function clearError() {
    errorMessage = '';
  }
</script>

<!-- Dashboard Layout -->
<div class="h-screen flex flex-col bg-gray-50">
  <!-- Header -->
  <header class="bg-white border-b border-gray-200 px-6 py-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <h1 class="text-2xl font-bold text-gray-900">VM Orchestrator</h1>
        <ConnectionStatus {connectionStatus} />
      </div>
    </div>
  </header>

  <!-- Global Error Display -->
  {#if errorMessage}
    <div class="px-6 py-2">
      <Alert variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription class="flex items-center justify-between">
          <span>{errorMessage}</span>
          <button 
            on:click={clearError} 
            class="ml-2 text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        </AlertDescription>
      </Alert>
    </div>
  {/if}

  <!-- Main Content -->
  <div class="flex-1 flex overflow-hidden">
    <!-- VM Management Panel -->
    <VMManagementPanel
      on:vm-selected={handleVMEvent}
      on:vm-created={handleVMEvent}
      on:vm-updated={handleVMEvent}
    />

    <!-- Execution Panel -->
    <div class="flex-1">
      <ExecutionPanel
        {wsService}
        {logLines}
        {errorMessage}
        oncommandexecute={handleExecuteCommand}
        ontabchanged={handleTabChanged}
        onclearerror={clearError}
      />
    </div>
  </div>
</div>
