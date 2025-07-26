/**
 * API Service
 *
 * Centralized service for making HTTP requests to the backend API.
 * Handles VM, Command, and Job operations with proper error handling.
 *
 * @fileoverview Frontend API service for HTTP communication
 */

/**
 * Base API service class for HTTP communication
 */
export class ApiService {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Make HTTP request with error handling
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<any>} Response data
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @returns {Promise<any>} Response data
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

/**
 * VM API service
 */
export class VMService extends ApiService {
  /**
   * Get all VMs
   * @returns {Promise<Array>} List of VMs
   */
  async getVMs() {
    return this.get('/api/vms');
  }

  /**
   * Get VM by ID
   * @param {string} id - VM ID
   * @returns {Promise<Object>} VM object
   */
  async getVM(id) {
    return this.get(`/api/vms/${id}`);
  }

  /**
   * Create new VM
   * @param {Object} vmData - VM data
   * @returns {Promise<Object>} Created VM
   */
  async createVM(vmData) {
    return this.post('/api/vms', vmData);
  }

  /**
   * Update VM
   * @param {string} id - VM ID
   * @param {Object} updates - VM updates
   * @returns {Promise<Object>} Updated VM
   */
  async updateVM(id, updates) {
    return this.put(`/api/vms/${id}`, updates);
  }

  /**
   * Delete VM
   * @param {string} id - VM ID
   * @returns {Promise<void>}
   */
  async deleteVM(id) {
    return this.delete(`/api/vms/${id}`);
  }
}

/**
 * Command API service
 */
export class CommandService extends ApiService {
  /**
   * Get commands for a VM
   * @param {string} vmId - VM ID
   * @returns {Promise<Array>} List of commands
   */
  async getVMCommands(vmId) {
    return this.get(`/api/vms/${vmId}/commands`);
  }

  /**
   * Get command by ID
   * @param {string} id - Command ID
   * @returns {Promise<Object>} Command object
   */
  async getCommand(id) {
    return this.get(`/api/commands/${id}`);
  }

  /**
   * Create new command for VM
   * @param {string} vmId - VM ID
   * @param {Object} commandData - Command data
   * @returns {Promise<Object>} Created command
   */
  async createCommand(vmId, commandData) {
    return this.post(`/api/vms/${vmId}/commands`, commandData);
  }

  /**
   * Update command
   * @param {string} id - Command ID
   * @param {Object} updates - Command updates
   * @returns {Promise<Object>} Updated command
   */
  async updateCommand(id, updates) {
    return this.put(`/api/commands/${id}`, updates);
  }

  /**
   * Delete command
   * @param {string} id - Command ID
   * @returns {Promise<void>}
   */
  async deleteCommand(id) {
    return this.delete(`/api/commands/${id}`);
  }
}

/**
 * Job API service
 */
export class JobService extends ApiService {
  /**
   * Get job history
   * @returns {Promise<Array>} List of jobs
   */
  async getJobs() {
    return this.get('/api/jobs');
  }

  /**
   * Get cached jobs for VM
   * @param {string} vmId - VM ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of cached jobs
   */
  async getVMJobs(vmId, options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.status) params.append('status', options.status);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.get(`/api/vms/${vmId}/jobs${query}`);
  }
}

// Create service instances
export const vmService = new VMService();
export const commandService = new CommandService();
export const jobService = new JobService();
