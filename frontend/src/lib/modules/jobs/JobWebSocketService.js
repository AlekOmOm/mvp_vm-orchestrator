/**
 * JobWebSocketService - Pure WebSocket service for real-time communication
 * NO REST API concerns, NO persistence
 */
export class JobWebSocketService {
   constructor(webSocketClient) {
      this.wsClient = webSocketClient;
      this.eventHandlers = {
         jobStarted: [],
         jobLog: [],
         jobCompleted: [],
         jobError: []
      };
      
      this.setupEventHandlers();
   }

   setupEventHandlers() {
      this.wsClient.on("job:started", (data) => {
         console.log("🚀 WebSocket job:started:", data);
         const job = {
            id: data.jobId,
            command: data.command,
            vmId: data.vmId,
            status: "running",
            startedAt: data.timestamp
         };
         this.eventHandlers.jobStarted.forEach(handler => handler(job));
      });

      this.wsClient.on("job:log", (data) => {
         const logEntry = {
            jobId: data.jobId,
            stream: data.stream,
            data: data.chunk,
            timestamp: data.timestamp
         };
         this.eventHandlers.jobLog.forEach(handler => handler(logEntry));
      });

      this.wsClient.on("job:done", (data) => {
         console.log("✅ WebSocket job:done:", data);
         const job = {
            status: data.status === "success" ? "completed" : "failed",
            exitCode: data.exitCode,
            finishedAt: data.timestamp
         };
         this.eventHandlers.jobCompleted.forEach(handler => handler(job));
      });

      this.wsClient.on("job:error", (data) => {
         console.error("❌ WebSocket job:error:", data);
         const error = {
            message: data.error,
            timestamp: data.timestamp
         };
         this.eventHandlers.jobError.forEach(handler => handler(error));
      });
   }

   // Event subscription methods
   onJobStarted(handler) { this.eventHandlers.jobStarted.push(handler); }
   onJobLog(handler) { this.eventHandlers.jobLog.push(handler); }
   onJobCompleted(handler) { this.eventHandlers.jobCompleted.push(handler); }
   onJobError(handler) { this.eventHandlers.jobError.push(handler); }

   // WebSocket operations only
   executeCommand(commandData) {
      if (!this.wsClient.getIsConnected()) {
         throw new Error("WebSocket not connected");
      }
      console.log("📤 WebSocket execute-command:", commandData);
      this.wsClient.emit("execute-command", commandData);
   }

   joinJob(jobId) {
      this.wsClient.emit("join-job", jobId);
   }
}
