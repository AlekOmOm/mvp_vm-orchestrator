/**
 * VM Management Service
 * Handles all VM CRUD operations with proper error handling and validation
 */
import { writable } from 'svelte/store';

export class VMService {
  constructor() {
    this.vms = writable([]);
    this.selectedVM = writable(null);
    this.loading = writable(false);
    this.error = writable(null);
  }

  /**
   * Validate VM data before operations
   * @param {Object} vmData - VM data to validate
   * @returns {Object} Validation result
   */
  validateVM(vmData) {
    const errors = [];
    
    if (!vmData.name?.trim()) {
      errors.push('VM name is required');
    }
    
    if (!vmData.host?.trim()) {
      errors.push('Host is required');
    }
    
    if (!vmData.userName?.trim()) {
      errors.push('Username is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a new VM
   * @param {Object} vmData - VM configuration
   * @returns {Promise<Object>} Created VM
   */
  async createVM(vmData) {
    this.loading.set(true);
    this.error.set(null);

    try {
      const validation = this.validateVM(vmData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const response = await fetch('/api/vms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vmData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create VM');
      }

      const newVM = await response.json();
      
      // Update local store
      this.vms.update(vms => [...vms, newVM]);
      
      return newVM;
    } catch (error) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Update an existing VM
   * @param {string} vmId - VM ID
   * @param {Object} updates - VM updates
   * @returns {Promise<Object>} Updated VM
   */
  async updateVM(vmId, updates) {
    this.loading.set(true);
    this.error.set(null);

    try {
      const validation = this.validateVM(updates);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const response = await fetch(`/api/vms/${vmId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update VM');
      }

      const updatedVM = await response.json();
      
      // Update local store
      this.vms.update(vms => 
        vms.map(vm => vm.id === vmId ? updatedVM : vm)
      );
      
      return updatedVM;
    } catch (error) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Delete a VM
   * @param {string} vmId - VM ID
   * @returns {Promise<void>}
   */
  async deleteVM(vmId) {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await fetch(`/api/vms/${vmId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete VM');
      }

      // Update local store
      this.vms.update(vms => vms.filter(vm => vm.id !== vmId));
      
      // Clear selection if deleted VM was selected
      this.selectedVM.update(selected => 
        selected?.id === vmId ? null : selected
      );
    } catch (error) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Load all VMs
   * @returns {Promise<Array>} List of VMs
   */
  async loadVMs() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await fetch('/api/vms');
      
      if (!response.ok) {
        throw new Error('Failed to load VMs');
      }

      const vms = await response.json();
      this.vms.set(vms);
      
      return vms;
    } catch (error) {
      this.error.set(error.message);
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  // Store getters
  getVMs() { return this.vms; }
  getSelectedVM() { return this.selectedVM; }
  getLoading() { return this.loading; }
  getError() { return this.error; }
}

// Export singleton instance
export const vmService = new VMService();