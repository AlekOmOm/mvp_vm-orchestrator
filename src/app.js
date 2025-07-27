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
import { createLogsRouter } from './routes/logs.js';
import sshHostsRouter from './routes/ssh-hosts.js';
import { createVmsRouter } from './routes/vms.js';
import { commandsRouter } from './routes/commands.js';
import { createJobsRouter } from './routes/jobs.js';
import { ExecutionManager } from './lib/execution-manager.js';

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
apiRouter.use('/vms', createVmsRouter(executionManager));
apiRouter.use('/commands', commandsRouter);
apiRouter.use('/jobs', createJobsRouter(db));
app.use('/api', apiRouter);

export { app, db, executionManager };
