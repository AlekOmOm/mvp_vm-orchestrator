import { writable, derived } from "svelte/store";

/**
 * CommandExecutor - WebSocket coordinator following established pattern
 */

import { getService } from "$lib/core/ServiceContainer.js";
import { getVMStore, getJobStore } from "$lib/state/stores.state.svelte.js";

export class CommandExecutor {
   constructor() {
      this.logLines = $state([]);
      this.isExecuting = $state(false);
      this.jobWebSocketService = null;
      this.vmStore = null;
      this.jobStore = null; // Add store reference
   }

   async initialize() {
      if (this.jobWebSocketService) return;

      this.vmStore = getVMStore();
      this.jobStore = getJobStore();

      // Wire WebSocket events to store
      this.jobWebSocketService.onJobStarted((job) => {
         this.jobStore.setCurrentJob(job); // Update store
         this.logLines = [];
         this.isExecuting = true;
      });

      this.jobWebSocketService.onJobCompleted((job) => {
         this.jobStore.setCurrentJob({ ...this.jobStore.currentJob, ...job });
         this.isExecuting = false;
         this.persistJobData(job);
      });
   }

   async executeCommand(selectedVM, command) {
      await this.initialize();

      const vm = await this.vmStore.getVM(selectedVM.alias);

      const commandPayload = {
         command: command.cmd,
         vmId: vm.id,
         type: command.type || "ssh",
         hostAlias: selectedVM.alias,
      };

      this.jobWebSocketService.executeCommand(commandPayload);
   }

   async persistJobData(completedJob) {
      // Use store instead of service directly
      await this.jobStore.updateJob(completedJob.id, completedJob);
   }

   // Expose store state via runes
   getCurrentJob() {
      return () => this.jobStore?.currentJob;
   }
   getLogLines() {
      return () => this.logLines;
   }
   getIsExecuting() {
      return () => this.isExecuting;
   }
}
