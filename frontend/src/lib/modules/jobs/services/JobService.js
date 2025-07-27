export class JobService {
   constructor(jobSocketService) {
      this.socket = jobSocketService;
   }

   getCurrentJob() {
      return this.socket.getCurrentJob();
   }

   getLogLines() {
      return this.socket.getLogLines();
   }

   getConnectionStatus() {
      return this.socket.getConnectionStatus();
   }

   get isConnected() {
      return this.socket.getIsConnected();
   }

   async executeCommand(vmId, command, options = {}) {
      if (!this.socket.getIsConnected()) {
         throw new Error("WebSocket connection not available");
      }

      console.log('🚀 JobService.executeCommand:', { vmId, command, options });

      const payload = {
         command,
         vmId,
         type: options.type || 'ssh',
         hostAlias: options.hostAlias,
         workingDir: options.workingDir,
         timeout: options.timeout
      };

      console.log('📤 Executing command payload:', payload);
      return this.socket.executeCommand(payload);
   }
}
