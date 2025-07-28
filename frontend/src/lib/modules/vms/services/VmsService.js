export class VmsService {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async listVMs() {
    return await this.api.get('/api/vms');
  }

  async getVM(id) {
    return await this.api.get(`/api/vms/${id}`);
  }

  async getVMByAlias(alias) {
    const vms = await this.listVMs();
    const vm = vms.find(v => v.alias === alias || v.name === alias);
    if (!vm) {
      throw new Error(`VM with alias '${alias}' not found`);
    }
    return vm;
  }

  async createVM(data) {
    return await this.api.post('/api/vms', data);
  }

  async updateVM(id, updates) {
    return await this.api.put(`/api/vms/${id}`, updates);
  }

  async deleteVM(id) {
    return await this.api.delete(`/api/vms/${id}`);
  }
} 