export class CommandService {
   constructor(apiClient) {
      this.api = apiClient;
   }

   async listVMCommands(vmId) {
      console.log("🔍 [CommandService] listVMCommands called with vmId:", vmId);
      const response = await this.api.get(`/api/vms/${vmId}/commands`);
      console.log("📋 [CommandService] API response:", response);
      return response;
   }

   async createCommand(vmId, data) {
      console.log("Creating command:", data);
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

   async getCommandTemplates() {
      console.log("🔍 [CommandService] Loading command templates");
      const response = await this.api.get('/api/commands');
      console.log("📋 [CommandService] Command templates loaded:", response);
      return response;
   }
}
