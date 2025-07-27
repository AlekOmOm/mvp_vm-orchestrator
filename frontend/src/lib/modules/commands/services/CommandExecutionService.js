import { writable } from 'svelte/store';

export class CommandExecutionService {
  constructor(jobService, vmService) {
    this.jobService = jobService;
    this.vmService = vmService;
    this.isExecuting = writable(false);
  }

  getIsExecuting() {
    return this.isExecuting;
  }

  async executeCommand(selectedVM, command) {
    if (!selectedVM) {
      throw new Error('VM not selected');
    }
    console.log('🚀 CommandExecutionService.executeCommand:', { vm: selectedVM.alias, cmd: command.cmd });
    this.isExecuting.set(true);
    try {
      const vm = await this.vmService.ensureRegistered(selectedVM.alias);
      console.log('✅ VM resolved:', vm);
      // Pass a single object to match JobWebSocketService.executeCommand signature
      const result = await this.jobService.executeCommand({
        command: command.cmd,
        type: command.type || 'ssh',
        workingDir: command.workingDir,
        hostAlias: selectedVM.alias,
        vmId: vm.id
      });
      console.log('✅ Command executed:', result);
      return result;
    } finally {
      this.isExecuting.set(false);
    }
  }
} 
