/**
 * VM Form Store
 * 
 * Handles VM form state management and operations.
 * Provides reusable logic for VM creation and editing forms.
 */

import { writable } from 'svelte/store';
import { vmStore } from './vmStore.js';

/**
 * Create VM form store with state management
 */
function createVMFormStore() {
  const { subscribe, set, update } = writable({
    showForm: false,
    editingVM: null,
    loading: false,
    error: null
  });

  return {
    subscribe,

    /**
     * Show form for creating a new VM
     */
    showCreateForm() {
      update(state => ({
        ...state,
        showForm: true,
        editingVM: null,
        error: null
      }));
    },

    /**
     * Show form for editing an existing VM
     * @param {Object} vm - VM to edit
     */
    showEditForm(vm) {
      update(state => ({
        ...state,
        showForm: true,
        editingVM: vm,
        error: null
      }));
    },

    /**
     * Hide the form
     */
    hideForm() {
      update(state => ({
        ...state,
        showForm: false,
        editingVM: null,
        error: null
      }));
    },

    /**
     * Submit VM form data
     * @param {Object} vmData - VM form data
     * @param {boolean} isEdit - Whether this is an edit operation
     */
    async submitForm(vmData, isEdit = false) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        let result;
        if (isEdit) {
          const editingVM = get(this).editingVM;
          if (!editingVM) {
            throw new Error('No VM selected for editing');
          }
          result = await vmStore.updateVM(editingVM.id, vmData);
          console.log("✅ VM updated successfully");
        } else {
          result = await vmStore.createVM(vmData);
          console.log("✅ VM created successfully");
        }

        // Close form on success
        this.hideForm();
        return result;
      } catch (error) {
        console.error("🚨 VM form submission error:", error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: error.message 
        }));
        throw error;
      } finally {
        update(state => ({ ...state, loading: false }));
      }
    },

    /**
     * Clear error state
     */
    clearError() {
      update(state => ({ ...state, error: null }));
    },

    /**
     * Reset form to initial state
     */
    reset() {
      set({
        showForm: false,
        editingVM: null,
        loading: false,
        error: null
      });
    }
  };
}

// Helper function to get current store value
function get(store) {
  let value;
  store.subscribe(v => value = v)();
  return value;
}

// Create and export the form store instance
export const vmFormStore = createVMFormStore();

/**
 * VM Form validation utilities
 */
export const vmFormValidation = {
  /**
   * Validate VM form data
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

    // Additional validation rules
    if (vmData.name && vmData.name.length < 2) {
      errors.push('VM name must be at least 2 characters long');
    }

    if (vmData.host && !/^[a-zA-Z0-9.-]+$/.test(vmData.host)) {
      errors.push('Host must contain only letters, numbers, dots, and hyphens');
    }

    if (vmData.port && (isNaN(vmData.port) || vmData.port < 1 || vmData.port > 65535)) {
      errors.push('Port must be a number between 1 and 65535');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Sanitize VM form data
   * @param {Object} vmData - Raw form data
   * @returns {Object} Sanitized VM data
   */
  sanitizeVMData(vmData) {
    return {
      name: vmData.name?.trim() || '',
      host: vmData.host?.trim() || '',
      userName: vmData.userName?.trim() || '',
      port: vmData.port ? parseInt(vmData.port, 10) : 22,
      environment: vmData.environment || 'development',
      description: vmData.description?.trim() || '',
      sshHost: vmData.sshHost?.trim() || null,
      tags: Array.isArray(vmData.tags) ? vmData.tags : []
    };
  }
};

/**
 * VM Form event handlers
 * Provides standardized event handling for VM forms
 */
export const vmFormHandlers = {
  /**
   * Handle form submission
   * @param {Event} event - Form submit event
   * @param {Function} onSuccess - Success callback
   * @param {Function} onError - Error callback
   */
  async handleSubmit(event, onSuccess, onError) {
    const { vmData, isEdit } = event.detail;
    
    try {
      // Validate data
      const validation = vmFormValidation.validateVM(vmData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Sanitize data
      const sanitizedData = vmFormValidation.sanitizeVMData(vmData);

      // Submit form
      const result = await vmFormStore.submitForm(sanitizedData, isEdit);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      if (onError) {
        onError(error);
      }
    }
  },

  /**
   * Handle form cancellation
   */
  handleCancel() {
    vmFormStore.hideForm();
  },

  /**
   * Handle showing create form
   */
  handleShowCreate() {
    vmFormStore.showCreateForm();
  },

  /**
   * Handle showing edit form
   * @param {Object} vm - VM to edit
   */
  handleShowEdit(vm) {
    vmFormStore.showEditForm(vm);
  }
};
