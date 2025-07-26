/**
 * Enhanced WebSocket Service with improved command execution
 */
import { io } from "socket.io-client";
import { writable } from "svelte/store";

export class WebSocketService {
  constructor() {
    this.socket = null;
    this.connectionStatus = writable("disconnected");
    this.currentJob = writable(null);
    this.logLines = writable([]);
    this.jobs = writable([]);
    this.commands = writable({});
    this.eventHandlers = new Map();
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    try {
      // Connect to /jobs namespace
      this.socket = io("/jobs", {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.setupEventHandlers();
      console.log("🔌 WebSocket connection initiated");
    } catch (error) {
      console.error("Failed to initialize WebSocket connection:", error);
      this.connectionStatus.set("error");
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    this.socket.on("connect", () => {
      console.log("✅ WebSocket connected to /jobs namespace");
      this.connectionStatus.set("connected");
      this.loadCommands();
      this.loadJobHistory();
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`❌ WebSocket disconnected: ${reason}`);
      this.connectionStatus.set("disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.error("🚨 WebSocket connection error:", error);
      this.connectionStatus.set("error");
    });

    // Job event handlers
    this.socket.on("job:started", (data) => {
      console.log("🚀 Job started:", data);
      this.currentJob.set(data);
      this.logLines.set([]);
      
      // Trigger custom handlers
      this.triggerEventHandlers('job:started', data);
    });

    this.socket.on("job:log", (data) => {
      console.log("📝 Job log:", { jobId: data.jobId, stream: data.stream, length: data.chunk?.length });
      
      this.logLines.update(lines => [...lines, {
        stream: data.stream,
        data: data.chunk,
        timestamp: data.timestamp || new Date().toISOString()
      }]);
      
      // Trigger custom handlers
      this.triggerEventHandlers('job:log', data);
    });

    this.socket.on("job:done", (data) => {
      console.log("✅ Job completed:", data);
      
      this.jobs.update(jobs => {
        const updatedJobs = jobs.map(job => 
          job.id === data.jobId 
            ? { ...job, status: data.status, exitCode: data.exitCode, finished_at: data.timestamp }
            : job
        );
        return updatedJobs;
      });
      
      this.currentJob.set(null);
      
      // Trigger custom handlers
      this.triggerEventHandlers('job:done', data);
    });

    this.socket.on("job:error", (data) => {
      console.error("🚨 Job error:", data);
      this.currentJob.set(null);
      
      // Trigger custom handlers
      this.triggerEventHandlers('job:error', data);
    });
  }

  /**
   * Execute command with improved format handling
   * @param {string|Object} commandData - Command to execute
   */
  executeCommand(commandData) {
    if (!this.socket || !this.socket.connected) {
      console.error("🚨 Cannot execute command: WebSocket not connected");
      throw new Error("WebSocket not connected");
    }

    let formattedCommand;

    // Handle different input formats
    if (typeof commandData === "string") {
      // Legacy format: just a command key
      console.log("📤 Executing legacy command:", commandData);
      formattedCommand = commandData;
    } else if (typeof commandData === "object" && commandData !== null) {
      // New object format
      console.log("📤 Executing command:", commandData);
      
      // Validate required fields
      if (!commandData.command) {
        throw new Error("Command is required");
      }
      
      formattedCommand = {
        command: commandData.command,
        type: commandData.type || 'stream',
        workingDir: commandData.workingDir,
        hostAlias: commandData.hostAlias,
        vmId: commandData.vmId
      };
    } else {
      throw new Error("Invalid command format");
    }

    // Emit command execution request
    this.socket.emit("execute-command", formattedCommand);
  }

  /**
   * Join a specific job room for monitoring
   * @param {string} jobId - Job ID to monitor
   */
  joinJob(jobId) {
    if (!this.socket || !this.socket.connected) {
      console.warn("Cannot join job room: WebSocket not connected");
      return;
    }

    console.log("🔗 Joining job room:", jobId);
    this.socket.emit("join-job", jobId);
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
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Load available commands
   */
  async loadCommands() {
    try {
      const response = await fetch('/api/commands');
      if (response.ok) {
        const commands = await response.json();
        this.commands.set(commands);
        console.log("📋 Commands loaded:", Object.keys(commands).length);
      }
    } catch (error) {
      console.error("Failed to load commands:", error);
    }
  }

  /**
   * Load job history
   */
  async loadJobHistory() {
    try {
      const response = await fetch('/api/jobs?limit=10');
      if (response.ok) {
        const jobs = await response.json();
        this.jobs.set(jobs);
        console.log("📚 Job history loaded:", jobs.length, "jobs");
      }
    } catch (error) {
      console.error("Failed to load job history:", error);
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.socket) {
      console.log("🔌 Disconnecting WebSocket");
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatus.set("disconnected");
  }

  // Store getters
  getConnectionStatus() { return this.connectionStatus; }
  getCurrentJob() { return this.currentJob; }
  getLogLines() { return this.logLines; }
  getJobs() { return this.jobs; }
  getCommands() { return this.commands; }
}
