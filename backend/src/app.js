// app.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SERVER_CONFIG,
  DATABASE_CONFIG,
} from './config/index.js';
import { Pool } from 'pg';
import { Router } from 'express';
import { commandsRouter } from './features/commands/commands.js';
import { createJobsRouter } from './features/jobs/jobs.js';
import { createLogsRouter } from './features/logs/logs.js';
import sshHostsRouter from './features/ssh-hosts/ssh-hosts.js';
import { ExecutionManager } from './features/commands/execution-manager.js';
import { createVmsRouter } from './features/vms/vms.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: SERVER_CONFIG.jsonLimit }));
app.use(
  express.urlencoded({
    extended: true,
    limit: SERVER_CONFIG.urlEncodedLimit,
  }),
);
app.use(express.static(path.join(__dirname, SERVER_CONFIG.staticPath)));

// Routers
const db = new Pool(DATABASE_CONFIG);
const executionManager = new ExecutionManager(null, db);
const apiRouter = Router();
apiRouter.use('/logs', createLogsRouter(db));
apiRouter.use('/ssh-hosts', sshHostsRouter);
apiRouter.use('/commands', commandsRouter);
apiRouter.use('/vms', createVmsRouter());
apiRouter.use('/jobs', createJobsRouter(db));
app.use('/api', apiRouter);

export { app, db, executionManager };
