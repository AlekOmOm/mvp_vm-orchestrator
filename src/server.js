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
import { Router } from "express";
import { fileURLToPath } from "url";
import { ExecutionManager } from "./lib/execution-manager.js";
import {
   setupJobsNamespace,
   enhanceExecutionManagerForNamespace,
} from "./websocket/jobs-namespace.js";
import {
   DATABASE_CONFIG,
   SERVER_CONFIG,
   WEBSOCKET_CONFIG,
   COMMANDS,
   getEnvironmentConfig,
} from "./config/index.js";
import { createLogsRouter } from './routes/logs.js';
import sshHostsRouter from './routes/ssh-hosts.js';
import { createVmsRouter } from './routes/vms.js';
import { commandsRouter } from './routes/commands.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = getEnvironmentConfig();
const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json({ limit: SERVER_CONFIG.jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: SERVER_CONFIG.urlEncodedLimit }));
app.use(express.static(path.join(__dirname, SERVER_CONFIG.staticPath)));

const io = new Server(server, {
   cors: WEBSOCKET_CONFIG.cors,
   pingTimeout: WEBSOCKET_CONFIG.pingTimeout,
   pingInterval: WEBSOCKET_CONFIG.pingInterval,
});

// Core Services
const db = new Pool(DATABASE_CONFIG);
const executionManager = new ExecutionManager(io, db);

// API Router Setup
const apiRouter = Router();
apiRouter.use('/logs', createLogsRouter(db));
apiRouter.use('/ssh-hosts', sshHostsRouter);
apiRouter.use('/vms', createVmsRouter(executionManager));
apiRouter.use('/commands', commandsRouter);
app.use('/api', apiRouter);

// WebSocket Namespace
const jobsNamespace = setupJobsNamespace(io, executionManager);
enhanceExecutionManagerForNamespace(executionManager, jobsNamespace);

// Event Handlers
db.on("error", (err) => {
   console.error("Database connection error:", err);
});

process.on("SIGTERM", async () => {
   console.log("SIGTERM received, shutting down gracefully");
   await db.end();
   server.close(() => {
      console.log("Server closed");
      process.exit(0);
   });
});

// Legacy WebSocket Handler
io.on("connection", (socket) => {
   console.log("Legacy client connected to root namespace");
   socket.on("execute-command", async (key) => {
      try {
         const command = COMMANDS[key];
         if (!command) {
            socket.emit("error", { message: `Unknown command: ${key}` });
            return;
         }
      } catch (error) {
         console.error("Legacy command execution error:", error);
         socket.emit("error", { message: error.message });
      }
   });
   socket.on("disconnect", () => {
      console.log("Legacy client disconnected");
   });
});

export { COMMANDS };

// Start Server
const PORT = SERVER_CONFIG.port;
server.listen(PORT, () => {
   console.log(`🚀 VM Orchestrator server running on port ${PORT}`);
   console.log(`📊 Frontend: http://localhost:${PORT}`);
   console.log(`🔌 WebSocket: ws://localhost:${PORT}/jobs`);
   console.log(`📡 API: http://localhost:${PORT}/api`);
});
