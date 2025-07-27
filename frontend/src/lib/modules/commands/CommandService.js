export class CommandService {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async listVMCommands(vmId) {
    return await this.api.get(`/api/vms/${vmId}/commands`);
  }

  async createCommand(vmId, data) {
    return await this.api.post(`/api/vms/${vmId}/commands`, data);
  }

  async getCommand(id) {
    return await this.api.get(`/api/commands/${id}`);
  }

  async updateCommand(id, updates) {
    return await this.api.put(`/api/commands/${id}`, updates);
  }

  async deleteCommand(id) {
    return await this.api.delete(`/api/commands/${id}`);
  }

  async getTemplates() {
    return await this.api.get('/api/commands');
  }
} 