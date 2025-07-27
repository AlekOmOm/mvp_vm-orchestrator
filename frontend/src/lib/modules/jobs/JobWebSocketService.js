/**
 * Job WebSocket Service
 *
 * High-level WebSocket service for job management and execution.
 * Wraps the core WebSocketClient and provides business logic for jobs.
 *
 * @fileoverview Job-specific WebSocket service with stores and execution logic
 */

import { writable, derived } from "svelte/store";
import { jobStore } from "../../stores/jobStore.js";
import { logStore } from "../../stores/logStore.js";

/**
 * Job WebSocket Service class
 *
 * Provides job-specific functionality on top of the core WebSocketClient.
 * Manages job execution, log aggregation, and job history.
 */
export class JobWebSocketService {
   constructor(webSocketClient, apiClient = null) {
      this.wsClient = webSocketClient;
      this.apiClient = apiClient;

      // Job-specific stores
      this.currentJob = writable(null);
      this.logLines = writable([]);
      this.jobs = writable([]);
      this.commands = writable({});

      // Event handlers for custom events
      this.eventHandlers = new Map();

      this.setupJobEventHandlers();
   }

   /**
    * Setup job-specific event handlers
    */
   setupJobEventHandlers() {
      // Job lifecycle events
      this.wsClient.on("job:started", (data) => {
         console.log("🚀 Job started:", data);

         const current = {
            ...data,
            id: data.jobId,
            startedAt:
               data.timestamp || data.started_at || new Date().toISOString(),
         };

         this.currentJob.set(current);
         this.logLines.set([]);

         this.triggerEventHandlers("job:started", current);

         // Update global job store
         try {
            const normalized = {
               ...current,
               vmId: data.hostAlias || data.vmId,
            };
            jobStore.setCurrentJob(normalized);
            jobStore.addJob({
               ...normalized,
               status: "running",
               started_at: normalized.startedAt,
            });
         } catch (_) {}
      });

      this.wsClient.on("job:log", (data) => {
         // Single source of truth: only logStore
         logStore.addLogLine(data.jobId, {
            stream: data.stream,
            data: data.chunk,
            timestamp: data.timestamp || new Date().toISOString(),
         });

         this.triggerEventHandlers("job:log", data);
      });

      // Enhanced job completion handling - listen for multiple event types
      const handleJobCompletion = (eventName, data) => {
         console.log(`✅ Job ${eventName}:`, data);

         // Determine final status based on event and data
         let finalStatus = data.status || "completed";
         if (eventName === "job:failed" || eventName === "job:error") {
            finalStatus = "failed";
         } else if (eventName === "job:completed" || eventName === "job:done") {
            finalStatus = data.status || "completed";
         }

         this.jobs.update((jobs) => {
            const updatedJobs = jobs.map((job) =>
               job.id === data.jobId
                  ? {
                       ...job,
                       status: finalStatus,
                       exitCode: data.exitCode || data.exit_code,
                       finished_at:
                          data.timestamp ||
                          data.finished_at ||
                          new Date().toISOString(),
                    }
                  : job
            );
            return updatedJobs;
         });

         this.currentJob.set(null);
         this.triggerEventHandlers(eventName, { ...data, status: finalStatus });

         // Reflect completion in global job store
         try {
            jobStore.updateJob(data.jobId, {
               status: finalStatus,
               exit_code: data.exitCode || data.exit_code,
               finished_at:
                  data.timestamp ||
                  data.finished_at ||
                  new Date().toISOString(),
            });
            jobStore.setCurrentJob(null);
         } catch (error) {
            console.error("Error updating job in store:", error);
         }
      };

      // Listen for multiple completion event types
      this.wsClient.on("job:done", (data) =>
         handleJobCompletion("job:done", data)
      );
      this.wsClient.on("job:completed", (data) =>
         handleJobCompletion("job:completed", data)
      );
      this.wsClient.on("job:finished", (data) =>
         handleJobCompletion("job:finished", data)
      );
      this.wsClient.on("job:failed", (data) =>
         handleJobCompletion("job:failed", data)
      );
      this.wsClient.on("job:error", (data) =>
         handleJobCompletion("job:error", data)
      );

      // Job progress updates
      this.wsClient.on("job:progress", (data) => {
         console.log("📊 Job progress:", data);

         try {
            jobStore.updateJob(data.jobId, {
               progress: data.progress,
               status: data.status || "running",
            });
         } catch (_) {}

         this.triggerEventHandlers("job:progress", data);
      });

      // Connection events - forward from core client
      this.wsClient.on("core:connected", () => {
         console.log("🔌 WebSocket connected, loading job history...");
         this.loadJobHistory();
      });

      // Add debugging for unknown events
      this.wsClient.on("*", (eventName, data) => {
         if (
            eventName.startsWith("job:") &&
            ![
               "job:started",
               "job:log",
               "job:done",
               "job:completed",
               "job:finished",
               "job:failed",
               "job:error",
               "job:progress",
            ].includes(eventName)
         ) {
            console.log(`🔍 Unknown job event: ${eventName}`, data);
         }
      });
   }

   /**
    * Execute command with improved format handling
    * @param {string|Object} commandData - Command to execute
    */
   executeCommand(commandData) {
      if (!this.wsClient.getIsConnected()) {
         console.error("🚨 Cannot execute command: WebSocket not connected");
         throw new Error("WebSocket not connected");
      }

      let formattedCommand;

      // Handle different input formats
      if (typeof commandData === "string") {
         console.log("📤 Executing legacy command:", commandData);
         formattedCommand = commandData;
      } else if (typeof commandData === "object" && commandData !== null) {
         console.log("📤 Executing command:", commandData);

         if (!commandData.command) {
            throw new Error("Command is required");
         }

         formattedCommand = {
            command: commandData.command,
            type: commandData.type || "stream",
            workingDir: commandData.workingDir,
            hostAlias: commandData.hostAlias,
            vmId: commandData.vmId,
         };
      } else {
         throw new Error("Invalid command format");
      }

      this.wsClient.emit("execute-command", formattedCommand);

      // Optimistically add job to jobStore for immediate feedback
      try {
         const optimisticJob = {
            id: crypto.randomUUID?.() || Date.now().toString(),
            vmId: formattedCommand.hostAlias || formattedCommand.vmId,
            command: formattedCommand.command,
            type: formattedCommand.type,
            status: "running",
            started_at: new Date().toISOString(),
         };
         jobStore.setCurrentJob(optimisticJob);
         jobStore.addJob(optimisticJob);
      } catch (_) {}
   }

   /**
    * Join a specific job room for monitoring
    * @param {string} jobId - Job ID to monitor
    */
   joinJob(jobId) {
      if (!this.wsClient.getIsConnected()) {
         console.warn("Cannot join job room: WebSocket not connected");
         return;
      }

      console.log("🔗 Joining job room:", jobId);
      this.wsClient.emit("join-job", jobId);
   }

   /**
    * Add custom event handler
    * @param {string} event - Event name
    * @param {Function} callback - Event callback
    */
   on(event, callback) {
      if (!this.eventHandlers.has(event)) {
         this.eventHandlers.set(event, []);
      }
      this.eventHandlers.get(event).push(callback);
   }

   /**
    * Trigger custom event handlers
    * @param {string} event - Event name
    * @param {*} data - Event data
    */
   triggerEventHandlers(event, data) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
         handlers.forEach((handler) => {
            try {
               handler(data);
            } catch (error) {
               console.error(`Error in event handler for ${event}:`, error);
            }
         });
      }
   }

   /**
    * Load available command templates
    */
   async loadCommandTemplates() {
      try {
         if (this.apiClient) {
            const templates = await this.apiClient.get("/api/commands");
            this.commands.set(templates);
            console.log(
               "📋 Command templates loaded:",
               Object.keys(templates).length
            );
            return templates;
         } else {
            const response = await fetch("/api/commands");
            if (response.ok) {
               const templates = await response.json();
               this.commands.set(templates);
               console.log(
                  "📋 Command templates loaded:",
                  Object.keys(templates).length
               );
               return templates;
            }
         }
      } catch (error) {
         console.error("Failed to load command templates:", error);
         throw error;
      }
   }

   /**
    * Load job history
    */
   async loadJobHistory() {
      try {
         if (this.apiClient) {
            const jobs = await this.apiClient.get("/api/jobs?limit=10");
            this.jobs.set(jobs);
            console.log("📚 Job history loaded:", jobs.length, "jobs");
         } else {
            const response = await fetch("/api/jobs?limit=10");
            if (response.ok) {
               const jobs = await response.json();
               this.jobs.set(jobs);
               console.log("📚 Job history loaded:", jobs.length, "jobs");
            }
         }
      } catch (error) {
         console.error("Failed to load job history:", error);
      }
   }

   /**
    * Check if WebSocket is connected
    * @returns {boolean} Connection status
    */
   getIsConnected() {
      return this.wsClient.getIsConnected();
   }

   /**
    * Legacy compatibility method
    * @returns {boolean} Connection status
    */
   isConnected() {
      return this.getIsConnected();
   }

   /**
    * Store getters for component compatibility
    */
   getConnectionStatus() {
      return this.wsClient.getConnectionStatus();
   }

   getCurrentJob() {
      return this.currentJob;
   }

   getLogLines() {
      return this.logLines;
   }

   getLogLinesForJob(jobId) {
      return derived(this.logLines, (lines) =>
         lines.filter((l) => l.jobId === jobId)
      );
   }

   subscribeLogs(jobIdOrCallback, maybeCallback) {
      if (typeof jobIdOrCallback === "function") {
         return this.logLines.subscribe(jobIdOrCallback);
      }
      const jobId = jobIdOrCallback;
      const callback = maybeCallback;
      return this.getLogLinesForJob(jobId).subscribe(callback);
   }

   getJobs() {
      return this.jobs;
   }

   getCommands() {
      return this.commands;
   }

   /**
    * Emit event to server (delegate to core client)
    * @param {string} event - Event name
    * @param {any} data - Event data
    */
   emit(event, data) {
      return this.wsClient.emit(event, data);
   }

   /**
    * Disconnect (delegate to core client)
    */
   disconnect() {
      return this.wsClient.disconnect();
   }
}
