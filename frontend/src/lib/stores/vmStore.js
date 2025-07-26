/**
 * VM Store
 *
 * Svelte store for managing VM state and operations.
 * Provides reactive state management for VM CRUD operations.
 *
 * @fileoverview VM state management store
 */

import { writable, derived } from 'svelte/store';
import { vmService } from '../services/ApiService.js';

/**
 * Create VM store with reactive state management
 */
function createVMStore() {
  // Core state
  const { subscribe, set, update } = writable({
    vms: [],
    selectedVM: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load all VMs from API
     */
    async loadVMs() {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const vms = await vmService.getVMs();
        update(state => ({ 
          ...state, 
          vms, 
          loading: false,
          // Keep selected VM if it still exists
          selectedVM: state.selectedVM && vms.find(vm => vm.id === state.selectedVM.id) 
            ? vms.find(vm => vm.id === state.selectedVM.id)
            : null
        }));
      } catch (error) {
        console.error('Failed to load VMs:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: error.message 
        }));
      }
    },

    /**
     * Create a new VM
     * @param {Object} vmData - VM data
     */
    async createVM(vmData) {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const newVM = await vmService.createVM(vmData);
        update(state => ({ 
          ...state, 
          vms: [...state.vms, newVM],
          loading: false 
        }));
        return newVM;
      } catch (error) {
        console.error('Failed to create VM:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: error.message 
        }));
        throw error;
      }
    },

    /**
     * Update an existing VM
     * @param {string} id - VM ID
     * @param {Object} updates - VM updates
     */
    async updateVM(id, updates) {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const updatedVM = await vmService.updateVM(id, updates);
        update(state => ({
          ...state,
          vms: state.vms.map(vm => vm.id === id ? updatedVM : vm),
          selectedVM: state.selectedVM?.id === id ? updatedVM : state.selectedVM,
          loading: false
        }));
        return updatedVM;
      } catch (error) {
        console.error('Failed to update VM:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: error.message 
        }));
        throw error;
      }
    },

    /**
     * Delete a VM
     * @param {string} id - VM ID
     */
    async deleteVM(id) {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        await vmService.deleteVM(id);
        update(state => ({
          ...state,
          vms: state.vms.filter(vm => vm.id !== id),
          selectedVM: state.selectedVM?.id === id ? null : state.selectedVM,
          loading: false
        }));
      } catch (error) {
        console.error('Failed to delete VM:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: error.message 
        }));
        throw error;
      }
    },

    /**
     * Select a VM for operations
     * @param {Object|null} vm - VM to select or null to deselect
     */
    selectVM(vm) {
      update(state => ({ ...state, selectedVM: vm }));
    },

    /**
     * Clear error state
     */
    clearError() {
      update(state => ({ ...state, error: null }));
    },

    /**
     * Reset store to initial state
     */
    reset() {
      set({
        vms: [],
        selectedVM: null,
        loading: false,
        error: null,
      });
    }
  };
}

// Create and export the store instance
export const vmStore = createVMStore();

// Derived stores for convenience
export const vms = derived(vmStore, $vmStore => $vmStore.vms);
export const selectedVM = derived(vmStore, $vmStore => $vmStore.selectedVM);
export const vmLoading = derived(vmStore, $vmStore => $vmStore.loading);
export const vmError = derived(vmStore, $vmStore => $vmStore.error);

// Derived store for VM options (for dropdowns, etc.)
export const vmOptions = derived(vms, $vms => 
  $vms.map(vm => ({
    value: vm.id,
    label: `${vm.name} (${vm.environment})`,
    vm
  }))
);
