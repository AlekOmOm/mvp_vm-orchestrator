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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
   cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
   },
});

const db = new Pool({
   user: process.env.POSTGRES_USER || "admin",
   host: "localhost",
   database: process.env.POSTGRES_DB || "mvp-vm-orchestrator",
   password: process.env.POSTGRES_PASSWORD || "admin",
   port: 5432,
});

// Initialize ExecutionManager
const executionManager = new ExecutionManager(io, db);

// Setup /jobs namespace for improved WebSocket architecture
const jobsNamespace = setupJobsNamespace(io, executionManager);
enhanceExecutionManagerForNamespace(executionManager, jobsNamespace);

const COMMANDS = {
   "vm-status": {
      type: "stream",
      cmd: 'echo "Simulating make status...done."',
   },
   "vm-logs": {
      type: "stream",
      cmd: 'echo "Simulating make logs...fake log output."',
   },
   "docker-ps": {
      type: "ssh",
      cmd: 'echo "Simulating ssh command...container up."',
   },
};

app.use(express.static(path.join(__dirname, "../../frontend/dist")));

app.get("/api/jobs", async (req, res) => {
   try {
      const result = await db.query(
         "SELECT id, type, command, status, started_at, finished_at FROM jobs ORDER BY started_at DESC LIMIT 10"
      );
      res.json(result.rows);
   } catch (e) {
      res.status(500).json({ error: e.message });
   }
});

io.on("connection", (socket) => {
   console.log("Client connected");

   socket.on("execute-command", async (key) => {
      const c = COMMANDS[key];
      if (!c) {
         socket.emit("error", { message: `Unknown command: ${key}` });
         return;
      }

      try {
         const result = await executionManager.executeWithStrategy(
            c.cmd,
            c.type,
            null // workingDir
         );

         // Legacy compatibility - emit job-started for existing frontend
         socket.emit("job-started", {
            jobId: result.jobId,
            command: c.cmd,
         });
      } catch (error) {
         socket.emit("error", { message: error.message });
      }
   });

   socket.on("disconnect", () => {
      console.log("Client disconnected");
   });
});

export { COMMANDS };

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});
