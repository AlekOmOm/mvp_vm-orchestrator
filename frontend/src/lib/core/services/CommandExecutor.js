import { writable, derived } from "svelte/store";

/**
 * Unified Command Execution Service
 *
 * Single source of truth for all command execution in the application.
 * Consolidates logic from CommandExecutionService and VMService.executeCommand()
 * to prevent duplicate executions and provide centralized state management.
 *
 * Features:
 * - Execution queue to prevent concurrent commands
 * - Centralized execution state
 * - Proper error handling and logging
 * - Integration with existing JobService and WebSocket layers
 * - VM resolution and registration
 */
export class CommandExecutor {
   constructor(jobService, vmService) {
      this.jobService = jobService;
      this.vmService = vmService;

      // Execution state management
      this.isExecuting = writable(false);
      this.currentExecution = writable(null);
      this.executionQueue = writable([]);
      this.executionHistory = writable([]);

      // Derived states for convenience - will be created lazily
      this.canExecute = null;

      // Internal state
      this.executionId = 0;
      this.maxHistorySize = 50;

      console.log("✅ CommandExecutor initialized");
   }

   /**
    * Get execution state stores
    */
   getIsExecuting() {
      return this.isExecuting;
   }

   getCurrentExecution() {
      return this.currentExecution;
   }

   getExecutionQueue() {
      return this.executionQueue;
   }

   getCanExecute() {
      if (!this.canExecute) {
         this.canExecute = derived(
            [this.isExecuting, this.jobService.getConnectionStatus()],
            ([executing, connectionStatus]) =>
               !executing && connectionStatus === "connected"
         );
      }
      return this.canExecute;
   }

   getExecutionHistory() {
      return this.executionHistory;
   }

   /**
    * Execute a command on a VM
    *
    * @param {Object} selectedVM - VM object with alias, name, etc.
    * @param {Object} command - Command object with cmd, type, workingDir, etc.
    * @param {Object} options - Additional execution options
    * @returns {Promise<string>} Job ID for tracking
    */
   async executeCommand(selectedVM, command, options = {}) {
      // Validation
      if (!selectedVM) {
         throw new Error("VM not selected");
      }

      if (!command || !command.cmd) {
         throw new Error("Command is required");
      }

      // Check if we can execute
      const connectionStatus = this.jobService.getConnectionStatus();
      if (!this.jobService.isConnected) {
         throw new Error("WebSocket connection not available");
      }

      // Check if already executing
      let executing = false;
      const unsubscribe = this.isExecuting.subscribe(
         (value) => (executing = value)
      );
      unsubscribe();
      if (executing) {
         throw new Error(
            "Another command is already executing. Please wait for it to complete."
         );
      }

      const executionId = ++this.executionId;
      const execution = {
         id: executionId,
         vm: selectedVM,
         command,
         options,
         startTime: new Date(),
         status: "starting",
      };

      console.log(`🚀 CommandExecutor.executeCommand [${executionId}]:`, {
         vm: selectedVM.alias,
         cmd: command.cmd,
         type: command.type || "ssh",
      });

      // Set execution state
      this.isExecuting.set(true);
      this.currentExecution.set(execution);

      try {
         // Step 1: Ensure VM is registered
         console.log(`📋 [${executionId}] Resolving VM: ${selectedVM.alias}`);
         const vm = await this.vmService.ensureRegistered(selectedVM.alias);
         console.log(`✅ [${executionId}] VM resolved:`, vm);

         // Step 2: Prepare command payload
         const commandPayload = {
            command: command.cmd,
            vmId: vm.id,
            type: command.type || options.type || "ssh",
            hostAlias: selectedVM.alias,
            workingDir: command.workingDir || options.workingDir,
            timeout: command.timeout || options.timeout,
         };

         // Update execution status
         execution.status = "executing";
         execution.vm = vm; // Update with resolved VM
         execution.payload = commandPayload;
         this.currentExecution.set({ ...execution });

         console.log(`📤 [${executionId}] Executing command:`, commandPayload);

         // Step 3: Execute via JobService (which uses JobWebSocketService)
         const result = await this.jobService.executeCommand(
            vm.id,
            command.cmd,
            {
               type: commandPayload.type,
               hostAlias: commandPayload.hostAlias,
               workingDir: commandPayload.workingDir,
               timeout: commandPayload.timeout,
            }
         );

         // Update execution status
         execution.status = "completed";
         execution.result = result;
         execution.endTime = new Date();
         execution.duration = execution.endTime - execution.startTime;

         console.log(
            `✅ [${executionId}] Command executed successfully:`,
            result
         );

         // Add to history
         this.addToHistory(execution);

         return result;
      } catch (error) {
         // Update execution status
         execution.status = "failed";
         execution.error = error.message;
         execution.endTime = new Date();
         execution.duration = execution.endTime - execution.startTime;

         console.error(`❌ [${executionId}] Command execution failed:`, error);

         // Add to history
         this.addToHistory(execution);

         // Re-throw for component handling
         throw error;
      } finally {
         // Always clear execution state
         this.isExecuting.set(false);
         this.currentExecution.set(null);
      }
   }

   /**
    * Add execution to history with size limit
    */
   addToHistory(execution) {
      this.executionHistory.update((history) => {
         const newHistory = [execution, ...history];
         return newHistory.slice(0, this.maxHistorySize);
      });
   }

   /**
    * Clear execution history
    */
   clearHistory() {
      this.executionHistory.set([]);
   }

   /**
    * Get execution statistics
    */
   getExecutionStats() {
      return derived(this.executionHistory, (history) => {
         const total = history.length;
         const successful = history.filter(
            (e) => e.status === "completed"
         ).length;
         const failed = history.filter((e) => e.status === "failed").length;
         const avgDuration =
            history.length > 0
               ? history.reduce((sum, e) => sum + (e.duration || 0), 0) /
                 history.length
               : 0;

         return {
            total,
            successful,
            failed,
            successRate:
               total > 0 ? ((successful / total) * 100).toFixed(1) : 0,
            avgDuration: Math.round(avgDuration),
         };
      });
   }

   /**
    * Cancel current execution (if possible)
    * Note: This is a placeholder for future implementation
    */
   async cancelExecution() {
      const current = this.currentExecution;
      if (!current) {
         return false;
      }

      console.log(`🛑 Attempting to cancel execution [${current.id}]`);

      // TODO: Implement cancellation logic
      // This would require backend support for job cancellation

      return false;
   }

   /**
    * Get current execution info for debugging
    */
   getDebugInfo() {
      return {
         isExecuting: this.isExecuting,
         currentExecution: this.currentExecution,
         executionId: this.executionId,
         canExecute: this.canExecute,
      };
   }
}
