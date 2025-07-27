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
      const result = await this.jobService.executeCommand(vm.id, command.cmd, {
        type: command.type || 'ssh',
        workingDir: command.workingDir,
        hostAlias: selectedVM.alias
      });
      console.log('✅ Command executed:', result);
      return result;
    } finally {
      this.isExecuting.set(false);
    }
  }
} 
