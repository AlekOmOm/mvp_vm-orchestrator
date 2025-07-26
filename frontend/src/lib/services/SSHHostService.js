/**
 * SSH Host Service
 *
 * Service for managing SSH hosts discovered from ~/.ssh/config
 * Provides the foundation for SSH-config-driven VM management.
 *
 * @fileoverview Frontend service for SSH host discovery and management
 */

import { ApiService } from './ApiService.js';

/**
 * SSH Host service for managing SSH configuration-based VMs
 */
export class SSHHostService extends ApiService {
  /**
   * Get all available SSH hosts from ~/.ssh/config
   * @returns {Promise<Array>} List of SSH hosts with VM suggestions
   */
  async getSSHHosts() {
    return this.get('/api/ssh-hosts');
  }

  /**
   * Get specific SSH host configuration
   * @param {string} alias - SSH host alias
   * @returns {Promise<Object>} SSH host configuration
   */
  async getSSHHost(alias) {
    return this.get(`/api/ssh-hosts/${alias}`);
  }

  /**
   * Test SSH connection to a host
   * @param {string} alias - SSH host alias
   * @param {number} timeout - Connection timeout in seconds
   * @returns {Promise<Object>} Connection test result
   */
  async testSSHConnection(alias, timeout = 10) {
    return this.post(`/api/ssh-hosts/${alias}/test`, { timeout });
  }

  /**
   * Validate SSH host configuration
   * @param {string} alias - SSH host alias
   * @returns {Promise<Object>} Validation result
   */
  async validateSSHHost(alias) {
    return this.get(`/api/ssh-hosts/${alias}/validate`);
  }

  /**
   * Create a VM from an SSH host
   * @param {Object} sshHost - SSH host object
   * @param {Object} vmData - Additional VM data
   * @returns {Promise<Object>} Created VM
   */
  async createVMFromSSHHost(sshHost, vmData = {}) {
    const vmPayload = {
      name: vmData.name || sshHost.suggestedVMName,
      host: sshHost.hostname,
      user: sshHost.user,
      port: sshHost.port || 22,
      environment: vmData.environment || 'development',
      description: vmData.description || `VM for ${sshHost.alias}`,
      sshHost: sshHost.alias, // Store the SSH config host alias
      ...vmData
    };

    // Use the existing VM service to create the VM
    const response = await fetch('/api/vms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vmPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Sync VMs with SSH config
   * Discovers new SSH hosts and suggests VM creation
   * @param {Array} existingVMs - Current VMs in the system
   * @returns {Promise<Object>} Sync result with suggestions
   */
  async syncWithSSHConfig(existingVMs = []) {
    try {
      const sshHosts = await this.getSSHHosts();
      
      // Create a map of existing VMs by SSH host
      const existingVMsBySSHHost = new Map();
      existingVMs.forEach(vm => {
        if (vm.sshHost) {
          existingVMsBySSHHost.set(vm.sshHost, vm);
        }
      });

      // Find SSH hosts that don't have corresponding VMs
      const newHosts = sshHosts.filter(host => 
        !existingVMsBySSHHost.has(host.alias)
      );

      // Find VMs that reference SSH hosts that no longer exist
      const orphanedVMs = existingVMs.filter(vm => 
        vm.sshHost && !sshHosts.some(host => host.alias === vm.sshHost)
      );

      // Find VMs that might need SSH host updates
      const outdatedVMs = existingVMs.filter(vm => {
        if (!vm.sshHost) return false;
        const sshHost = sshHosts.find(host => host.alias === vm.sshHost);
        if (!sshHost) return false;
        
        // Check if VM details don't match SSH config
        return (
          vm.host !== sshHost.hostname ||
          vm.user !== sshHost.user ||
          vm.port !== sshHost.port
        );
      });

      return {
        sshHosts,
        newHosts,
        orphanedVMs,
        outdatedVMs,
        suggestions: {
          create: newHosts.map(host => ({
            action: 'create',
            sshHost: host,
            suggestedVM: {
              name: host.suggestedVMName,
              host: host.hostname,
              user: host.user,
              port: host.port,
              sshHost: host.alias,
              environment: 'development'
            }
          })),
          update: outdatedVMs.map(vm => {
            const sshHost = sshHosts.find(host => host.alias === vm.sshHost);
            return {
              action: 'update',
              vm,
              sshHost,
              suggestedUpdates: {
                host: sshHost.hostname,
                user: sshHost.user,
                port: sshHost.port
              }
            };
          }),
          remove: orphanedVMs.map(vm => ({
            action: 'remove',
            vm,
            reason: 'SSH host no longer exists in config'
          }))
        }
      };
    } catch (error) {
      console.error('Error syncing with SSH config:', error);
      throw error;
    }
  }

  /**
   * Get SSH hosts grouped by cloud provider
   * @returns {Promise<Object>} SSH hosts grouped by provider
   */
  async getSSHHostsByProvider() {
    const hosts = await this.getSSHHosts();
    
    const grouped = {
      aws: [],
      gcp: [],
      azure: [],
      digitalocean: [],
      other: []
    };

    hosts.forEach(host => {
      const provider = host.cloudProvider?.toLowerCase();
      if (provider === 'aws') {
        grouped.aws.push(host);
      } else if (provider === 'google cloud') {
        grouped.gcp.push(host);
      } else if (provider === 'azure') {
        grouped.azure.push(host);
      } else if (provider === 'digitalocean') {
        grouped.digitalocean.push(host);
      } else {
        grouped.other.push(host);
      }
    });

    return grouped;
  }
}

// Create and export service instance
export const sshHostService = new SSHHostService();
