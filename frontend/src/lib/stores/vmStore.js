/**
 * VM Store
 *
 * Enhanced VM store using base store pattern for consistent state management.
 * Auto-discovers VMs from SSH configuration (~/.ssh/config) via SSH host service.
 * VMs are read-only and managed through SSH configuration.
 *
 * @fileoverview VM state management store with SSH auto-discovery
 */

import { derived } from "svelte/store";
import { createBaseStore, withLoadingState } from "./baseStore.js";
import { getService } from "../core/ServiceContainer.js";

/**
 * Create VM store with enhanced base store functionality
 */
function createVMStore() {
   // Initial state
   const initialState = {
      vms: [],
      selectedVM: null,
      loading: false,
      error: null,
   };

   // Create base store with logging enabled
   const baseStore = createBaseStore(initialState, {
      name: "VMStore",
      enableLogging: true,
   });

   return {
      ...baseStore,

      /**
       * Load all VMs from API
       */
      async loadVMs() {
         return withLoadingState(
            baseStore,
            async () => {
               const vmService = getService("vmService");
               const vms = await vmService.loadVMs();

               baseStore.updateWithLoading((state) => {
                  return {
                     ...state,
                     vms,
                     // Keep selected VM if it still exists
                     selectedVM:
                        state.selectedVM &&
                        vms.find((vm) => vm.id === state.selectedVM.id)
                           ? vms.find((vm) => vm.id === state.selectedVM.id)
                           : null,
                  };
               }, false);

               return vms;
            },
            { operationName: "loadVMs", logOperation: true }
         );
      },

      /**
       * Test SSH connection to a VM
       * @param {string} alias - SSH host alias
       */
      async testConnection(alias) {
         return withLoadingState(
            baseStore,
            async () => {
               const vmService = getService("vmService");
               return await vmService.testConnection(alias);
            },
            { operationName: `testConnection(${alias})`, logOperation: true }
         );
      },

      /**
       * Refresh VM list (reload from SSH discovery)
       */
      async refreshVMs() {
         return this.loadVMs();
      },

      /**
       * Select a VM
       * @param {Object|null} vm - VM to select or null to deselect
       */
      selectVM(vm) {
         baseStore.setState({ selectedVM: vm });
      },

      /**
       * Get VM by ID
       * @param {string} id - VM ID
       * @returns {Object|null} VM object or null
       */
      getVMById(id) {
         const state = baseStore.getValue();
         return state.vms.find((vm) => vm.id === id) || null;
      },

      /**
       * Filter VMs by environment
       * @param {string} environment - Environment to filter by
       * @returns {Array} Filtered VMs
       */
      getVMsByEnvironment(environment) {
         const state = baseStore.getValue();
         return state.vms.filter((vm) => vm.environment === environment);
      },
   };
}

// Create and export the store instance
export const vmStore = createVMStore();

// Derived stores for convenience
export const vms = derived(vmStore, ($vmStore) => $vmStore.vms);
export const selectedVM = derived(vmStore, ($vmStore) => $vmStore.selectedVM);
export const vmLoading = derived(vmStore, ($vmStore) => $vmStore.loading);
export const vmError = derived(vmStore, ($vmStore) => $vmStore.error);

// Derived store for VM options (for dropdowns, etc.)
export const vmOptions = derived(vms, ($vms) =>
   $vms.map((vm) => ({
      value: vm.id,
      label: `${vm.name} (${vm.environment})`,
      vm,
   }))
);

// Additional derived stores
export const vmsByEnvironment = derived(vms, ($vms) => {
   const grouped = {};
   $vms.forEach((vm) => {
      if (!grouped[vm.environment]) {
         grouped[vm.environment] = [];
      }
      grouped[vm.environment].push(vm);
   });
   return grouped;
});

export const hasVMs = derived(vms, ($vms) => $vms.length > 0);
export const vmCount = derived(vms, ($vms) => $vms.length);
