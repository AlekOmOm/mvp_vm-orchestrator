# vm-orchestrator - PRD

## Architecture Overview

### Hybrid Execution Strategy
```
Web UI (Svelte) → Backend (Node.js) → Execution Layer
                                   ├── Terminal Spawn (Interactive)
                                   ├── Process + WebSocket (Streaming) 
                                   └── SSH + Stream (Remote Logs)
```

### Technology Stack (Exam-Compliant)
- **Frontend**: SvelteKit + shadcn-svelte + Socket.io-client
- **Backend**: Node.js + Express + Socket.io + Postgres
- **Optional**: AWS Lambda + DynamoDB (audit trail backup)
- **SSH**: ~/.ssh/config parsing middleware
- **Execution**: Hybrid (terminal spawn + process streaming)

---

## Core Implementation Components

### 1. SSH Config Inheritance (Backend Middleware)

```javascript
// src/lib/ssh-manager.js
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

class SSHManager {
  static parseSSHConfig() {
    const configPath = path.join(process.env.HOME, '.ssh/config');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    const hosts = {};
    let currentHost = null;
    
    configContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('Host ')) {
        currentHost = trimmed.split(' ')[1];
        hosts[currentHost] = {};
      } else if (currentHost && trimmed.includes(' ')) {
        const [key, value] = trimmed.split(' ', 2);
        hosts[currentHost][key.toLowerCase()] = value;
      }
    });
    
    return hosts;
  }
  
  static getConnectionString(hostAlias) {
    const hosts = this.parseSSHConfig();
    const config = hosts[hostAlias];
    if (!config) throw new Error(`Host ${hostAlias} not found in SSH config`);
    
    return {
      host: config.hostname || hostAlias,
      user: config.user || 'ubuntu',
      port: config.port || 22,
      identityFile: config.identityfile
    };
  }
  
  static executeRemote(hostAlias, command, streamCallback) {
    const conn = this.getConnectionString(hostAlias);
    const sshCmd = spawn('ssh', [
      '-o', 'StrictHostKeyChecking=no',
      `${conn.user}@${conn.host}`,
      command
    ]);
    
    sshCmd.stdout.on('data', data => streamCallback('stdout', data.toString()));
    sshCmd.stderr.on('data', data => streamCallback('stderr', data.toString()));
    
    return sshCmd;
  }
}
```

### 2. Hybrid Execution Engine

```javascript
// src/lib/execution-manager.js
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

class ExecutionManager {
  constructor(io, db) {
    this.io = io;
    this.db = db;
    this.activeJobs = new Map();
  }
  
  // Interactive commands - spawn terminal
  async spawnTerminal(command, workingDir = null) {
    const jobId = uuidv4();
    
    // Log to database
    await this.db.query(
      'INSERT INTO jobs (id, type, command, status) VALUES ($1, $2, $3, $4)',
      [jobId, 'terminal', command, 'spawned']
    );
    
    // Platform-specific terminal spawning
    let terminalCmd;
    if (process.platform === 'darwin') {
      // macOS: Open Terminal with command
      terminalCmd = spawn('open', ['-a', 'Terminal'], { 
        cwd: workingDir,
        env: { ...process.env, TERMINAL_CMD: command }
      });
    } else {
      // Linux: Use gnome-terminal or fallback
      terminalCmd = spawn('gnome-terminal', ['--', 'bash', '-c', command], {
        cwd: workingDir
      });
    }
    
    return { jobId, terminal: terminalCmd };
  }
  
  // Non-interactive commands - stream to WebSocket
  async executeWithStream(alias, target, args = []) {
    const jobId = uuidv4();
    const command = `${alias} ${target} ${args.join(' ')}`;
    
    // Database logging
    await this.db.query(
      'INSERT INTO jobs (id, type, command, status, started_at) VALUES ($1, $2, $3, $4, NOW())',
      [jobId, 'mkcli', command, 'running']
    );
    
    // Execute process
    const process = spawn(alias, [target, ...args], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    this.activeJobs.set(jobId, process);
    
    // Stream output via WebSocket
    process.stdout.on('data', async (data) => {
      const chunk = data.toString();
      this.io.emit('job:log', { jobId, stream: 'stdout', chunk });
      
      // Store in database
      await this.db.query(
        'INSERT INTO job_events (job_id, stream, chunk) VALUES ($1, $2, $3)',
        [jobId, 'stdout', chunk]
      );
    });
    
    process.stderr.on('data', async (data) => {
      const chunk = data.toString();
      this.io.emit('job:log', { jobId, stream: 'stderr', chunk });
      
      await this.db.query(
        'INSERT INTO job_events (job_id, stream, chunk) VALUES ($1, $2, $3)',
        [jobId, 'stderr', chunk]
      );
    });
    
    process.on('close', async (code) => {
      const status = code === 0 ? 'success' : 'failed';
      
      await this.db.query(
        'UPDATE jobs SET status = $1, finished_at = NOW() WHERE id = $2',
        [status, jobId]
      );
      
      this.io.emit('job:done', { jobId, status, exitCode: code });
      this.activeJobs.delete(jobId);
    });
    
    return { jobId, process };
  }
  
  // SSH log streaming
  async streamRemoteLogs(hostAlias, logCommand) {
    const jobId = uuidv4();
    
    await this.db.query(
      'INSERT INTO jobs (id, type, command, status, started_at) VALUES ($1, $2, $3, $4, NOW())',
      [jobId, 'ssh-logs', `${hostAlias}: ${logCommand}`, 'running']
    );
    
    const sshProcess = SSHManager.executeRemote(hostAlias, logCommand, 
      async (stream, chunk) => {
        this.io.emit('job:log', { jobId, stream, chunk });
        
        await this.db.query(
          'INSERT INTO job_events (job_id, stream, chunk) VALUES ($1, $2, $3)',
          [jobId, stream, chunk]
        );
      }
    );
    
    this.activeJobs.set(jobId, sshProcess);
    
    return { jobId, process: sshProcess };
  }
}
```

### 3. mkcli Integration

```javascript
// src/lib/mkcli-manager.js
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

class MkcliManager {
  static getRegistryPath() {
    return path.join(process.env.HOME, '.config/mkcli/registry');
  }
  
  static parseRegistry() {
    try {
      const registryPath = this.getRegistryPath();
      const content = fs.readFileSync(registryPath, 'utf8');
      
      const aliases = {};
      content.split('\n').forEach(line => {
        const [alias, dir] = line.trim().split('=');
        if (alias && dir) {
          aliases[alias] = dir;
        }
      });
      
      return aliases;
    } catch (error) {
      console.error('Failed to parse mkcli registry:', error);
      return {};
    }
  }
  
  static async discoverTargets(alias) {
    return new Promise((resolve, reject) => {
      // Try --list-targets first, fallback to parsing
      const process = spawn(alias, ['--list-targets'], { stdio: 'pipe' });
      
      let output = '';
      process.stdout.on('data', data => output += data.toString());
      
      process.on('close', (code) => {
        if (code === 0) {
          const targets = output.split('\n')
            .filter(line => line.trim())
            .map(line => line.trim());
          resolve(targets);
        } else {
          // Fallback: parse Makefile
          this.parseTargetsFromMakefile(alias).then(resolve).catch(reject);
        }
      });
      
      process.on('error', () => {
        this.parseTargetsFromMakefile(alias).then(resolve).catch(reject);
      });
    });
  }
  
  static async parseTargetsFromMakefile(alias) {
    const registry = this.parseRegistry();
    const dir = registry[alias];
    
    if (!dir) throw new Error(`Alias ${alias} not found`);
    
    const makefilePath = path.join(dir, 'Makefile');
    const content = fs.readFileSync(makefilePath, 'utf8');
    
    const targets = [];
    content.split('\n').forEach(line => {
      const match = line.match(/^([a-zA-Z0-9_-]+):/);
      if (match && !match[1].startsWith('.')) {
        targets.push(match[1]);
      }
    });
    
    return targets;
  }
}
```

### 4. vm-config Integration

```javascript
// src/lib/vmconfig-manager.js
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

class VMConfigManager {
  static findEnvironments(basePath = './environments') {
    try {
      const envDirs = fs.readdirSync(basePath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      return envDirs.map(env => ({
        name: env,
        configPath: path.join(basePath, env, 'config.yml'),
        exists: fs.existsSync(path.join(basePath, env, 'config.yml'))
      }));
    } catch (error) {
      console.error('Failed to find vm-config environments:', error);
      return [];
    }
  }
  
  static parseEnvironment(envName, basePath = './environments') {
    const configPath = path.join(basePath, envName, 'config.yml');
    
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = yaml.load(content);
      
      return {
        name: envName,
        template: config.template,
        vms: Object.entries(config.vms || {}).map(([name, vmConfig]) => ({
          name,
          host: vmConfig.host,
          user: vmConfig.ansible_user || 'ubuntu',
          environment: envName
        }))
      };
    } catch (error) {
      console.error(`Failed to parse environment ${envName}:`, error);
      return null;
    }
  }
  
  static getAllVMs(basePath = './environments') {
    const environments = this.findEnvironments(basePath);
    const allVMs = [];
    
    environments.forEach(env => {
      if (env.exists) {
        const parsed = this.parseEnvironment(env.name, basePath);
        if (parsed) {
          allVMs.push(...parsed.vms);
        }
      }
    });
    
    return allVMs;
  }
}
```

---

## API Design

### HTTP Endpoints

```javascript
// API routes
app.get('/api/projects', async (req, res) => {
  const registry = MkcliManager.parseRegistry();
  const projects = Object.entries(registry).map(([alias, dir]) => ({
    alias, dir, targets: []
  }));
  res.json(projects);
});

app.get('/api/projects/:alias/targets', async (req, res) => {
  try {
    const targets = await MkcliManager.discoverTargets(req.params.alias);
    res.json(targets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vms', (req, res) => {
  const vms = VMConfigManager.getAllVMs();
  res.json(vms);
});

app.post('/api/jobs/terminal', async (req, res) => {
  const { alias, target, args, workingDir } = req.body;
  const command = `${alias} ${target} ${args?.join(' ') || ''}`;
  
  const result = await executionManager.spawnTerminal(command, workingDir);
  res.json({ jobId: result.jobId, type: 'terminal' });
});

app.post('/api/jobs/stream', async (req, res) => {
  const { alias, target, args } = req.body;
  
  const result = await executionManager.executeWithStream(alias, target, args);
  res.json({ jobId: result.jobId, type: 'stream' });
});

app.post('/api/jobs/ssh-logs', async (req, res) => {
  const { hostAlias, command } = req.body;
  
  const result = await executionManager.streamRemoteLogs(hostAlias, command);
  res.json({ jobId: result.jobId, type: 'ssh-logs' });
});
```

### WebSocket Events

```javascript
// WebSocket namespace: /jobs
io.of('/jobs').on('connection', (socket) => {
  
  socket.on('join-job', (jobId) => {
    socket.join(jobId);
  });
  
  socket.on('cancel-job', async (jobId) => {
    const job = executionManager.activeJobs.get(jobId);
    if (job) {
      job.kill('SIGTERM');
      await db.query('UPDATE jobs SET status = $1 WHERE id = $2', ['canceled', jobId]);
    }
  });
  
});

// Server emits:
// job:log { jobId, stream, chunk }
// job:done { jobId, status, exitCode }
// job:error { jobId, error }
```

---

## Database Schema (Postgres)

```sql
-- Projects (synced from mkcli registry)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias TEXT UNIQUE NOT NULL,
  directory TEXT NOT NULL,
  last_synced TIMESTAMPTZ DEFAULT NOW()
);

-- VMs (synced from vm-config environments)  
CREATE TABLE vms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  user_name TEXT NOT NULL,
  environment TEXT NOT NULL,
  ssh_config_host TEXT, -- Reference to ~/.ssh/config Host entry
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, environment)
);

-- Jobs (execution tracking)
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('mkcli', 'ssh-logs', 'terminal')),
  project_id UUID REFERENCES projects(id),
  vm_id UUID REFERENCES vms(id),
  command TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed', 'canceled', 'spawned')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  exit_code INTEGER
);

-- Job output streaming (time-series)
CREATE TABLE job_events (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  stream TEXT NOT NULL CHECK (stream IN ('stdout', 'stderr', 'system')),
  chunk TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_job_events_job_id_time ON job_events(job_id, timestamp);
CREATE INDEX idx_jobs_status ON jobs(status);
```

---

## Svelte Frontend Structure

```
src/
├── app.html
├── routes/
│   ├── +layout.svelte           # Main layout with socket connection
│   ├── +page.svelte             # Dashboard overview
│   ├── projects/
│   │   ├── +page.svelte         # Projects list
│   │   └── [alias]/+page.svelte # Project detail with targets
│   ├── vms/
│   │   ├── +page.svelte         # VMs list  
│   │   └── [id]/+page.svelte    # VM detail with log streaming
│   └── jobs/
│       ├── +page.svelte         # Jobs history
│       └── [id]/+page.svelte    # Job detail with log replay
├── lib/
│   ├── components/
│   │   ├── JobConsole.svelte    # Real-time log display
│   │   ├── ProjectCard.svelte   # Project with targets
│   │   ├── VMCard.svelte        # VM with log presets
│   │   └── JobHistory.svelte    # Job list with filters
│   ├── stores/
│   │   ├── socket.js            # WebSocket connection store
│   │   ├── jobs.js              # Active jobs state
│   │   └── projects.js          # Projects/VMs data
│   └── utils/
│       ├── api.js               # HTTP client
│       └── terminal.js          # Terminal spawning helpers
```

### Key Svelte Components

```svelte
<!-- JobConsole.svelte - Real-time log streaming -->
<script>
  import { onMount } from 'svelte';
  import { socket } from '$lib/stores/socket.js';
  
  export let jobId;
  
  let logLines = [];
  let autoScroll = true;
  let consoleElement;
  
  onMount(() => {
    if (jobId) {
      socket.emit('join-job', jobId);
      
      socket.on('job:log', (data) => {
        if (data.jobId === jobId) {
          logLines = [...logLines, { 
            stream: data.stream, 
            chunk: data.chunk,
            timestamp: new Date()
          }];
          
          if (autoScroll) {
            setTimeout(() => consoleElement?.scrollTo(0, consoleElement.scrollHeight), 10);
          }
        }
      });
      
      socket.on('job:done', (data) => {
        if (data.jobId === jobId) {
          logLines = [...logLines, {
            stream: 'system',
            chunk: `Process finished with exit code ${data.exitCode}`,
            timestamp: new Date()
          }];
        }
      });
    }
  });
</script>

<div class="console-container">
  <div class="console-header">
    <h3>Job: {jobId}</h3>
    <label>
      <input type="checkbox" bind:checked={autoScroll} />
      Auto-scroll
    </label>
  </div>
  
  <div class="console-output" bind:this={consoleElement}>
    {#each logLines as line}
      <div class="log-line {line.stream}">
        <span class="timestamp">{line.timestamp.toLocaleTimeString()}</span>
        <span class="content">{line.chunk}</span>
      </div>
    {/each}
  </div>
</div>
```

---

## Implementation Timeline (16 Hours)

### Phase 1: Foundation (4 hours)
- Express + Socket.io + Postgres setup
- Basic Svelte app with WebSocket connection  
- Simple job execution + streaming proof
- SSH config parsing middleware

### Phase 2: Tool Integration (4 hours)
- mkcli registry reading + target discovery
- vm-config environment parsing + VM discovery
- Basic project/VM listing UI

### Phase 3: Execution Engine (4 hours)
- Terminal spawning implementation
- Process streaming with WebSocket
- SSH log streaming
- Job management (start, cancel, history)

### Phase 4: Polish + Demo (4 hours)
- shadcn-svelte component integration
- Error handling + reconnection logic
- Job history UI with Postgres querying
- Demo preparation + testing

---

## Exam Demonstration Script

### Core Features Demo
1. **Project Discovery**: Show mkcli registry sync + target discovery
2. **Interactive Execution**: Click "vm create" → terminal spawns
3. **Streaming Execution**: Click "vm status" → live output in web UI  
4. **Remote Log Streaming**: Click VM "docker logs" → SSH + WebSocket streaming
5. **Job History**: Show Postgres audit trail across browser refreshes
6. **SSH Integration**: Demonstrate ~/.ssh/config inheritance

### Technology Showcase
- **WebSockets**: Real-time log streaming with multiple concurrent jobs
- **Postgres**: Complex queries for job history, event replay
- **Svelte**: Reactive UI updates, component composition with shadcn-svelte
- **Systems Integration**: SSH, filesystem, process management

This implementation satisfies all exam requirements while delivering a genuinely useful DevOps tool!