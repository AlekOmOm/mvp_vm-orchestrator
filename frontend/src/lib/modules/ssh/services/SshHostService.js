export class SshHostService {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async listHosts() {
    return await this.api.get('/api/ssh-hosts');
  }

  async getHost(alias) {
    return await this.api.get(`/api/ssh-hosts/${alias}`);
  }

  async testConnection(alias, timeout = 10) {
    return await this.api.post(`/api/ssh-hosts/${alias}/test`, { timeout });
  }

  async validateHost(alias) {
    return await this.api.get(`/api/ssh-hosts/${alias}/validate`);
  }
} 