/**
 * VM Orchestrator Server
 *
 * Main server application that provides a web interface for executing commands
 * on local and remote systems with real-time log streaming capabilities.
 *
 * @fileoverview Express server with WebSocket support for command execution
 */

import express from "express";
import http from "http";
import { Server } from "socket.io";
import { Pool } from "pg";
import path from "path";
import { fileURLToPath } from "url";
import { ExecutionManager } from "./lib/execution-manager.js";
import {
   setupJobsNamespace,
   enhanceExecutionManagerForNamespace,
} from "./websocket/jobs-namespace.js";
import { SSHManager } from "./lib/ssh-manager.js";
import { serverlessAPI } from "./lib/serverless-api-client.js";
import {
   DATABASE_CONFIG,
   SERVER_CONFIG,
   WEBSOCKET_CONFIG,
   COMMANDS,
   getEnvironmentConfig,
} from "./config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get environment-specific configuration
const config = getEnvironmentConfig();

/**
 * Express application instance
 */
const app = express();

/**
 * HTTP server instance
 */
const server = http.createServer(app);

/**
 * Socket.IO server instance with CORS configuration
 */
const io = new Server(server, {
   cors: WEBSOCKET_CONFIG.cors,
   pingTimeout: WEBSOCKET_CONFIG.pingTimeout,
   pingInterval: WEBSOCKET_CONFIG.pingInterval,
});

/**
 * PostgreSQL connection pool
 */
const db = new Pool(DATABASE_CONFIG);

/**
 * Command execution manager instance
 */
const executionManager = new ExecutionManager(io, db);

/**
 * WebSocket namespace for job-related events
 */
const jobsNamespace = setupJobsNamespace(io, executionManager);
enhanceExecutionManagerForNamespace(executionManager, jobsNamespace);

/**
 * Database connection error handler
 */
db.on("error", (err) => {
   console.error("Database connection error:", err);
});

/**
 * Graceful shutdown handler
 */
process.on("SIGTERM", async () => {
   console.log("SIGTERM received, shutting down gracefully");
   await db.end();
   server.close(() => {
      console.log("Server closed");
      process.exit(0);
   });
});

// Middleware configuration
app.use(express.json({ limit: SERVER_CONFIG.jsonLimit }));
app.use(
   express.urlencoded({ extended: true, limit: SERVER_CONFIG.urlEncodedLimit })
);
app.use(express.static(path.join(__dirname, SERVER_CONFIG.staticPath)));

/**
 * API Routes
 */

/**
 * Get available commands
 * @route GET /api/commands
 * @returns {Object} Available commands configuration
 */
app.get("/api/commands", (_, res) => {
   try {
      res.json(COMMANDS);
   } catch (error) {
      console.error("Error fetching commands:", error);
      res.status(500).json({ error: "Failed to fetch commands" });
   }
});

/**
 * Get job history
 * @route GET /api/jobs
 * @query {number} [limit=10] - Maximum number of jobs to return
 * @returns {Array} Array of job objects
 */
app.get("/api/jobs", async (req, res) => {
   try {
      const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Cap at 100
      const result = await db.query(
         "SELECT id, type, command, status, started_at, finished_at, exit_code FROM jobs ORDER BY started_at DESC LIMIT $1",
         [limit]
      );
      res.json(result.rows);
   } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ error: "Failed to fetch job history" });
   }
});

/**
 * VM Management Endpoints
 */

/**
 * Get all available SSH hosts from ~/.ssh/config
 * @route GET /api/ssh-hosts
 * @returns {Array} Array of SSH host configurations with VM suggestions
 */
app.get("/api/ssh-hosts", (_, res) => {
   try {
      const hosts = SSHManager.getAllHosts();

      // Transform for frontend consumption
      const sshHosts = hosts.map((host) => ({
         alias: host.alias,
         suggestedVMName: host.suggestedVMName,
         hostname: host.config.host,
         user: host.config.user,
         port: host.config.port,
         identityFile: host.config.identityFile,
         // Additional metadata for UI
         isCloudInstance:
            host.config.host &&
            (host.config.host.includes("amazonaws.com") ||
               host.config.host.includes("googleusercontent.com") ||
               host.config.host.includes("azure") ||
               host.config.host.includes("digitalocean")),
         cloudProvider: getCloudProvider(host.config.host),
      }));

      res.json(sshHosts);
   } catch (error) {
      console.error("Error fetching SSH hosts:", error);
      res.status(500).json({ error: "Failed to fetch SSH hosts" });
   }
});

/**
 * Helper function to determine cloud provider from hostname
 * @param {string} hostname - The hostname to analyze
 * @returns {string|null} Cloud provider name or null
 */
function getCloudProvider(hostname) {
   if (!hostname) return null;

   const host = hostname.toLowerCase();

   if (host.includes("amazonaws.com")) return "AWS";
   if (host.includes("googleusercontent.com") || host.includes("gcp"))
      return "Google Cloud";
   if (host.includes("azure")) return "Azure";
   if (host.includes("digitalocean")) return "DigitalOcean";
   if (host.includes("linode")) return "Linode";
   if (host.includes("vultr")) return "Vultr";

   return null;
}

/**
 * Test SSH connection to a specific VM
 * @route GET /api/vms/:hostAlias/test
 * @param {string} hostAlias - SSH host alias
 * @returns {Object} Connection test result
 */
app.get("/api/vms/:hostAlias/test", async (req, res) => {
   try {
      const { hostAlias } = req.params;

      if (!hostAlias) {
         return res.status(400).json({ error: "Host alias is required" });
      }

      const result = await SSHManager.testConnection(hostAlias);
      res.json(result);
   } catch (error) {
      console.error(
         `Error testing connection to ${req.params.hostAlias}:`,
         error
      );
      res.status(500).json({ error: error.message });
   }
});

/**
 * Execute command on a specific VM
 * @route POST /api/vms/:hostAlias/execute
 * @param {string} hostAlias - SSH host alias
 * @body {string} command - Command to execute
 * @returns {Object} Job execution result
 */
app.post("/api/vms/:hostAlias/execute", async (req, res) => {
   try {
      const { hostAlias } = req.params;
      const { command } = req.body;

      if (!hostAlias) {
         return res.status(400).json({ error: "Host alias is required" });
      }

      if (!command || typeof command !== "string") {
         return res
            .status(400)
            .json({ error: "Command is required and must be a string" });
      }

      const result = await executionManager.executeWithStrategy(
         command,
         "ssh",
         null, // workingDir
         hostAlias
      );

      res.json({ jobId: result.jobId, type: "ssh" });
   } catch (error) {
      console.error(
         `Error executing command on ${req.params.hostAlias}:`,
         error
      );
      res.status(500).json({ error: error.message });
   }
});

// ============================================================================
// VM Management API Endpoints (Proxy to Serverless)
// ============================================================================

/**
 * Get all VMs
 * @route GET /api/vms
 */
app.get("/api/vms", async (req, res) => {
   try {
      const vms = await serverlessAPI.getVMs();
      res.json(vms);
   } catch (error) {
      console.error("Error fetching VMs:", error);
      res.status(500).json({ error: error.message });
   }
});

/**
 * Create new VM
 * @route POST /api/vms
 */
app.post("/api/vms", async (req, res) => {
   try {
      const vm = await serverlessAPI.createVM(req.body);
      res.status(201).json(vm);
   } catch (error) {
      console.error("Error creating VM:", error);
      const status = error.message.includes("already exists") ? 409 : 500;
      res.status(status).json({ error: error.message });
   }
});

/**
 * Get specific VM
 * @route GET /api/vms/:id
 */
app.get("/api/vms/:id", async (req, res) => {
   try {
      const vm = await serverlessAPI.getVM(req.params.id);
      res.json(vm);
   } catch (error) {
      console.error("Error fetching VM:", error);
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({ error: error.message });
   }
});

/**
 * Update VM
 * @route PUT /api/vms/:id
 */
app.put("/api/vms/:id", async (req, res) => {
   try {
      const vm = await serverlessAPI.updateVM(req.params.id, req.body);
      res.json(vm);
   } catch (error) {
      console.error("Error updating VM:", error);
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({ error: error.message });
   }
});

/**
 * Delete VM
 * @route DELETE /api/vms/:id
 */
app.delete("/api/vms/:id", async (req, res) => {
   try {
      await serverlessAPI.deleteVM(req.params.id);
      res.status(204).send();
   } catch (error) {
      console.error("Error deleting VM:", error);
      res.status(500).json({ error: error.message });
   }
});

// ============================================================================
// Command Management API Endpoints (Proxy to Serverless)
// ============================================================================

/**
 * Get commands for a VM
 * @route GET /api/vms/:vmId/commands
 */
app.get("/api/vms/:vmId/commands", async (req, res) => {
   try {
      const commands = await serverlessAPI.getVMCommands(req.params.vmId);
      res.json(commands);
   } catch (error) {
      console.error("Error fetching VM commands:", error);
      res.status(500).json({ error: error.message });
   }
});

/**
 * Create command for VM
 * @route POST /api/vms/:vmId/commands
 */
app.post("/api/vms/:vmId/commands", async (req, res) => {
   try {
      const command = await serverlessAPI.createCommand(
         req.params.vmId,
         req.body
      );
      res.status(201).json(command);
   } catch (error) {
      console.error("Error creating command:", error);
      const status = error.message.includes("already exists")
         ? 409
         : error.message.includes("not found")
         ? 404
         : 500;
      res.status(status).json({ error: error.message });
   }
});

/**
 * Get specific command
 * @route GET /api/commands/:id
 */
app.get("/api/commands/:id", async (req, res) => {
   try {
      const command = await serverlessAPI.getCommand(req.params.id);
      res.json(command);
   } catch (error) {
      console.error("Error fetching command:", error);
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({ error: error.message });
   }
});

/**
 * Update command
 * @route PUT /api/commands/:id
 */
app.put("/api/commands/:id", async (req, res) => {
   try {
      const command = await serverlessAPI.updateCommand(
         req.params.id,
         req.body
      );
      res.json(command);
   } catch (error) {
      console.error("Error updating command:", error);
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({ error: error.message });
   }
});

/**
 * Delete command
 * @route DELETE /api/commands/:id
 */
app.delete("/api/commands/:id", async (req, res) => {
   try {
      await serverlessAPI.deleteCommand(req.params.id);
      res.status(204).send();
   } catch (error) {
      console.error("Error deleting command:", error);
      res.status(500).json({ error: error.message });
   }
});

/**
 * Legacy WebSocket connection handler (for backward compatibility)
 * Note: New clients should use the /jobs namespace instead
 */
io.on("connection", (socket) => {
   console.log("Legacy client connected to root namespace");

   socket.on("execute-command", async (key) => {
      try {
         const command = COMMANDS[key];
         if (!command) {
            socket.emit("error", { message: `Unknown command: ${key}` });
            return;
         }

         const result = await executionManager.executeWithStrategy(
            command.cmd,
            command.type,
            null, // workingDir
            command.hostAlias
         );

         // Legacy compatibility - emit job-started for existing frontend
         socket.emit("job-started", {
            jobId: result.jobId,
            command: command.cmd,
         });
      } catch (error) {
         console.error("Legacy command execution error:", error);
         socket.emit("error", { message: error.message });
      }
   });

   socket.on("disconnect", () => {
      console.log("Legacy client disconnected");
   });
});

/**
 * Export commands for external use (e.g., tests)
 */
export { COMMANDS };

/**
 * Start the server
 */
const PORT = SERVER_CONFIG.port;
server.listen(PORT, () => {
   console.log(`🚀 VM Orchestrator server running on port ${PORT}`);
   console.log(`📊 Frontend: http://localhost:${PORT}`);
   console.log(`🔌 WebSocket: ws://localhost:${PORT}/jobs`);
   console.log(`📡 API: http://localhost:${PORT}/api`);
});

app.get("/api/vms/:vmId/jobs", async (req, res) => {
   try {
      const jobs = await serverlessAPI.getVMJobs(req.params.vmId, req.query);
      res.json(jobs);
   } catch (error) {
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({ error: error.message });
   }
});
