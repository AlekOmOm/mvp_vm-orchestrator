export function setupJobsNamespace(io, executionManager) {
  const jobsNamespace = io.of('/jobs');
  
  jobsNamespace.on('connection', (socket) => {
    console.log('Client connected to /jobs namespace:', socket.id);
    
    // Handle command execution requests
    socket.on('execute-command', async (data) => {
      console.log('Execute command request:', data);
      
      const { command, type = 'stream', workingDir } = data;
      
      if (!command) {
        socket.emit('job:error', { error: 'Command is required' });
        return;
      }
      
      try {
        const result = await executionManager.executeWithStrategy(command, type, workingDir);
        
        // Join the job room for real-time updates
        socket.join(result.jobId);
        
        socket.emit('job:started', { 
          jobId: result.jobId, 
          type, 
          command,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Command execution error:', error);
        socket.emit('job:error', { error: error.message });
      }
    });

    // Handle joining specific job rooms for monitoring
    socket.on('join-job', (jobId) => {
      console.log(`Client ${socket.id} joining job room: ${jobId}`);
      socket.join(jobId);
      socket.emit('job:joined', { jobId });
    });

    // Handle leaving job rooms
    socket.on('leave-job', (jobId) => {
      console.log(`Client ${socket.id} leaving job room: ${jobId}`);
      socket.leave(jobId);
      socket.emit('job:left', { jobId });
    });

    // Handle job cancellation requests
    socket.on('cancel-job', async (data) => {
      const { jobId } = data;
      
      if (!jobId) {
        socket.emit('job:error', { error: 'Job ID is required' });
        return;
      }
      
      try {
        await executionManager.cancelJob(jobId);
        
        // Notify all clients in the job room
        jobsNamespace.to(jobId).emit('job:canceled', { 
          jobId,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Job cancellation error:', error);
        socket.emit('job:error', { error: error.message });
      }
    });

    // Handle requests for active jobs list
    socket.on('get-active-jobs', () => {
      const activeJobs = executionManager.getActiveJobs();
      socket.emit('active-jobs', { jobs: activeJobs });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected from /jobs namespace: ${socket.id}, reason: ${reason}`);
    });
  });
  
  return jobsNamespace;
}

// Enhanced ExecutionManager integration for namespace broadcasting
export function enhanceExecutionManagerForNamespace(executionManager, jobsNamespace) {
  // Override the io emit methods to use namespace broadcasting
  const originalSetupStreamHandlers = executionManager.setupStreamHandlers;
  
  executionManager.setupStreamHandlers = function(jobId, process) {
    process.stdout.on("data", async (data) => {
      const chunk = data.toString();
      await this.logJobEvent(jobId, "stdout", chunk);
      
      // Broadcast to job room in namespace
      jobsNamespace.to(jobId).emit("job:log", { jobId, stream: "stdout", chunk });
      
      // Legacy compatibility
      this.io.emit("job-log", { jobId, stream: "stdout", data: chunk });
    });

    process.stderr.on("data", async (data) => {
      const chunk = data.toString();
      await this.logJobEvent(jobId, "stderr", chunk);
      
      // Broadcast to job room in namespace
      jobsNamespace.to(jobId).emit("job:log", { jobId, stream: "stderr", chunk });
      
      // Legacy compatibility
      this.io.emit("job-log", { jobId, stream: "stderr", data: chunk });
    });

    process.on("close", async (code) => {
      const status = code === 0 ? "success" : "failed";
      await this.db.query(
        "UPDATE jobs SET status = $1, finished_at = NOW(), exit_code = $2 WHERE id = $3",
        [status, code, jobId]
      );

      // Broadcast to job room in namespace
      jobsNamespace.to(jobId).emit("job:done", { 
        jobId, 
        status, 
        exitCode: code,
        timestamp: new Date().toISOString()
      });
      
      // Legacy compatibility
      this.io.emit("job-finished", { jobId, status, exitCode: code });
      
      this.activeJobs.delete(jobId);
    });

    process.on("error", async (error) => {
      await this.logJobEvent(jobId, "system", `Process error: ${error.message}`);
      await this.db.query(
        "UPDATE jobs SET status = $1, finished_at = NOW() WHERE id = $2",
        ["failed", jobId]
      );

      // Broadcast to job room in namespace
      jobsNamespace.to(jobId).emit("job:error", { 
        jobId, 
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Legacy compatibility
      this.io.emit("job:error", { jobId, error: error.message });
      
      this.activeJobs.delete(jobId);
    });
  };
}
