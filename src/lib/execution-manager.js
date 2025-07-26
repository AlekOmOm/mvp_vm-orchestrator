import { spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { TerminalSpawnStrategy } from "./strategies/terminal-spawn-strategy.js";
import { LocalStreamStrategy } from "./strategies/local-stream-strategy.js";
import { SshStreamStrategy } from "./strategies/ssh-stream-strategy.js";

export class ExecutionManager {
   constructor(io, db) {
      this.io = io;
      this.db = db;
      this.activeJobs = new Map();
   }

   async executeWithStrategy(command, type = "stream", workingDir = null) {
      const jobId = uuidv4();

      try {
         // Insert job record
         await this.db.query(
            "INSERT INTO jobs (id, command, type, status, started_at) VALUES ($1, $2, $3, $4, NOW())",
            [jobId, command, type, "running"]
         );

         let result;
         switch (type) {
            case "terminal":
               result = await this.executeTerminal(jobId, command, workingDir);
               break;
            case "stream":
               result = await this.executeStream(jobId, command, workingDir);
               break;
            case "ssh":
               result = await this.executeSsh(jobId, command);
               break;
            default:
               throw new Error(`Unknown execution type: ${type}`);
         }

         return { jobId, ...result };
      } catch (error) {
         // Update job status to failed
         await this.db.query(
            "UPDATE jobs SET status = $1, finished_at = NOW() WHERE id = $2",
            ["failed", jobId]
         );
         throw error;
      }
   }

   async executeTerminal(jobId, command, workingDir) {
      // Update job status to spawned for terminal jobs
      await this.db.query("UPDATE jobs SET status = $1 WHERE id = $2", [
         "spawned",
         jobId,
      ]);

      const process = TerminalSpawnStrategy.spawn(command, workingDir);
      this.activeJobs.set(jobId, { process, type: "terminal" });

      // Emit job started event
      this.io.emit("job:started", { jobId, type: "terminal", command });

      return { type: "terminal", spawned: true };
   }

   async executeStream(jobId, command, workingDir) {
      const process = LocalStreamStrategy.spawn(command, workingDir);
      this.activeJobs.set(jobId, { process, type: "stream" });

      // Emit job started event (both new and legacy formats)
      this.io.emit("job:started", { jobId, type: "stream", command });
      this.io.emit("job-started", { jobId, command }); // Legacy format

      // Set up stream handlers
      this.setupStreamHandlers(jobId, process);

      return { type: "stream", process };
   }

   async executeSsh(jobId, command) {
      const process = SshStreamStrategy.spawn(command);
      this.activeJobs.set(jobId, { process, type: "ssh" });

      // Emit job started event (both new and legacy formats)
      this.io.emit("job:started", { jobId, type: "ssh", command });
      this.io.emit("job-started", { jobId, command }); // Legacy format

      // Set up stream handlers
      this.setupStreamHandlers(jobId, process);

      return { type: "ssh", process };
   }

   setupStreamHandlers(jobId, process) {
      process.stdout.on("data", async (data) => {
         const chunk = data.toString();
         await this.logJobEvent(jobId, "stdout", chunk);
         // Emit both new and legacy formats
         this.io.emit("job:log", { jobId, stream: "stdout", chunk });
         this.io.emit("job-log", { jobId, stream: "stdout", data: chunk }); // Legacy format
      });

      process.stderr.on("data", async (data) => {
         const chunk = data.toString();
         await this.logJobEvent(jobId, "stderr", chunk);
         // Emit both new and legacy formats
         this.io.emit("job:log", { jobId, stream: "stderr", chunk });
         this.io.emit("job-log", { jobId, stream: "stderr", data: chunk }); // Legacy format
      });

      process.on("close", async (code) => {
         const status = code === 0 ? "success" : "failed";
         await this.db.query(
            "UPDATE jobs SET status = $1, finished_at = NOW(), exit_code = $2 WHERE id = $3",
            [status, code, jobId]
         );

         // Emit both new and legacy formats
         this.io.emit("job:done", { jobId, status, exitCode: code });
         this.io.emit("job-finished", { jobId, status, exitCode: code }); // Legacy format
         this.activeJobs.delete(jobId);
      });

      process.on("error", async (error) => {
         await this.logJobEvent(
            jobId,
            "system",
            `Process error: ${error.message}`
         );
         await this.db.query(
            "UPDATE jobs SET status = $1, finished_at = NOW() WHERE id = $2",
            ["failed", jobId]
         );

         this.io.emit("job:error", { jobId, error: error.message });
         this.activeJobs.delete(jobId);
      });
   }

   async logJobEvent(jobId, stream, chunk) {
      try {
         await this.db.query(
            "INSERT INTO job_events (job_id, stream, chunk) VALUES ($1, $2, $3)",
            [jobId, stream, chunk]
         );
      } catch (error) {
         console.error("Failed to log job event:", error);
      }
   }

   async cancelJob(jobId) {
      const job = this.activeJobs.get(jobId);
      if (!job) {
         throw new Error(`Job ${jobId} not found or already finished`);
      }

      try {
         job.process.kill("SIGTERM");

         // Update job status
         await this.db.query(
            "UPDATE jobs SET status = $1, finished_at = NOW() WHERE id = $2",
            ["canceled", jobId]
         );

         this.io.emit("job:canceled", { jobId });
         this.activeJobs.delete(jobId);

         return { success: true };
      } catch (error) {
         throw new Error(`Failed to cancel job ${jobId}: ${error.message}`);
      }
   }

   getActiveJobs() {
      return Array.from(this.activeJobs.keys());
   }

   isJobActive(jobId) {
      return this.activeJobs.has(jobId);
   }
}
