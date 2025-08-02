export class JobService {
   constructor(jobSocketService, apiClient) {
      this.socket = jobSocketService;
      this.apiClient = apiClient;
      this.jobStore = null; // Will be set by ServiceContainer
   }

   /**
    * Set job store reference for real-time updates
    */
   setJobStore(jobStore) {
      this.jobStore = jobStore;
      
      // Connect WebSocket service callbacks to jobStore
      this.socket.setJobCallbacks({
         onJobStarted: (job) => {
            console.log("🔄 JobService: Adding started job to store:", job);
            this.jobStore.addJob({
               ...job,
               status: "running",
               started_at: job.startedAt,
            });
            this.jobStore.setCurrentJob(job);
         },
         onJobCompleted: (jobId, updates) => {
            console.log("🔄 JobService: Updating completed job:", jobId, updates);
            this.jobStore.updateJob(jobId, updates);
            this.jobStore.setCurrentJob(null);
         },
         onJobHistoryLoaded: (jobs) => {
            console.log("🔄 JobService: Loading job history to store:", jobs.length);
            // Update the store's jobs array directly
            this.jobStore.setJobs(jobs);
         }
      });
   }

   getCurrentJob() {
      return this.socket.getCurrentJob();
   }

   getLogLines() {
      console.log("getLogLines");

      return this.socket.getLogLines();
   }

   getConnectionStatus() {
      console.log("[JobService] getConnectionStatus");
      return this.socket.getConnectionStatus();
   }

   get isConnected() {
      return this.socket.getIsConnected();
   }

   async executeCommand(vmId, command, options = {}) {
      if (!this.socket.getIsConnected()) {
         throw new Error("WebSocket connection not available");
      }

      console.log("🚀 JobService.executeCommand:", { vmId, command, options });

      const payload = {
         command,
         vmId,
         type: options.type || "ssh",
         hostAlias: options.hostAlias,
         workingDir: options.workingDir,
         timeout: options.timeout,
      };

      console.log("📤 Executing command payload:", payload);
      return this.socket.executeCommand(payload);
   }

   async fetchJobs(options = {}) {
      const params = new URLSearchParams();
      if (options.limit) params.append("limit", options.limit);

      const query = params.toString() ? `?${params.toString()}` : "";
      return this.apiClient.get(`/api/jobs${query}`);
   }

   async fetchJobById(jobId) {
      return this.apiClient.get(`/api/jobs/${jobId}`);
   }

   async fetchJobLogs(jobId, options = {}) {
      const params = new URLSearchParams();
      if (options.limit) params.append("limit", options.limit);

      const query = params.toString() ? `?${params.toString()}` : "";
      return this.apiClient.get(`/api/jobs/${jobId}/logs${query}`);
   }

   async fetchVMJobs(vmId, options = {}) {
      const params = new URLSearchParams();
      if (options.limit) params.append("limit", options.limit);
      if (options.status) params.append("status", options.status);

      const query = params.toString() ? `?${params.toString()}` : "";
      return this.apiClient.get(`/api/vms/${vmId}/jobs${query}`);
   }

   async createJob(jobData) {
      return this.apiClient.post("/api/jobs", jobData);
   }

   async updateJob(jobId, updates) {
      return this.apiClient.put(`/api/jobs/${jobId}`, updates);
   }
}
