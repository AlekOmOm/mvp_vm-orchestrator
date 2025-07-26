import { writable } from 'svelte/store';
import { io } from 'socket.io-client';

export class WebSocketService {
  constructor() {
    this.socket = null;
    this.connectionStatus = writable('connecting');
    this.commands = writable({});
    this.currentJob = writable(null);
    this.logLines = writable([]);
    this.jobs = writable([]);
    
    this.connect();
  }

  connect() {
    this.socket = io('http://localhost:3000');
    
    this.socket.on('connect', () => {
      this.connectionStatus.set('connected');
      this.loadCommands();
      this.loadJobHistory();
    });
    
    this.socket.on('disconnect', () => {
      this.connectionStatus.set('disconnected');
    });
    
    this.socket.on('job-started', (data) => {
      this.currentJob.set(data);
      this.logLines.set([]);
    });
    
    this.socket.on('job-log', (data) => {
      this.logLines.update(lines => [...lines, {
        stream: data.stream,
        data: data.data,
        timestamp: new Date().toISOString()
      }]);
    });
    
    this.socket.on('job-finished', (data) => {
      this.currentJob.set(null);
      this.loadJobHistory();
    });
  }

  loadCommands() {
    this.commands.set({
      'vm-ops': {
        type: 'local',
        description: 'VM management commands',
        commands: [
          { name: 'vm-status', description: 'Check VM status' },
          { name: 'vm-logs', description: 'View VM logs' }
        ]
      },
      'docker': {
        type: 'ssh',
        description: 'Docker operations',
        commands: [
          { name: 'docker-ps', description: 'List containers via SSH' }
        ]
      }
    });
  }

  async loadJobHistory() {
    try {
      const response = await fetch('/api/jobs');
      const jobs = await response.json();
      this.jobs.set(jobs);
    } catch (error) {
      console.error('Failed to load job history:', error);
    }
  }

  executeCommand(commandGroup, commandName) {
    const key = commandName;
    this.socket.emit('execute-command', key);
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  getCommands() {
    return this.commands;
  }

  getCurrentJob() {
    return this.currentJob;
  }

  getLogLines() {
    return this.logLines;
  }

  getJobs() {
    return this.jobs;
  }
} 