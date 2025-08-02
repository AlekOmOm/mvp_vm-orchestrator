/**
 * VM Form Store
 * 
 * Handles VM form state management and operations.
 * Provides reusable logic for VM creation and editing forms.
 */

import { writable } from 'svelte/store';
import { getVMStore } from '$lib/state/stores.state.svelte.js';

/**
 * Create VM form store with state management
 */
function createVMFormStore() {
  const { subscribe, set, update } = writable({
    loading: false,
    error: null,
    showForm: false,
    editingVM: null
  });

  return {
    subscribe,

    /**
     * Submit form data
     */
    async submitForm(vmData, isEdit = false) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        let result;
        const vmStore = getVMStore();
        
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
     * Show form for editing
     */
    showEditForm(vm) {
      set({
        showForm: true,
        editingVM: vm,
        loading: false,
        error: null
      });
    },

    /**
     * Show form for creating
     */
    showCreateForm() {
      set({
        showForm: true,
        editingVM: null,
        loading: false,
        error: null
      });
    },

    /**
     * Hide form
     */
    hideForm() {
      update(state => ({ ...state, showForm: false }));
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
 * Form handling utilities
 */
export const vmFormHandlers = {
  /**
   * Handle form submission
   */
  async handleSubmit(vmData, isEdit = false, { onSuccess, onError } = {}) {
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
  }
};
