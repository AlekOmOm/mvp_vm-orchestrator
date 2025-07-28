/**
 * VM Store
 *
 * Enhanced VM store using base store pattern for consistent state management.
 * Auto-discovers VMs from SSH configuration (~/.ssh/config) via SSH host service.
 * VMs are read-only and managed through SSH configuration.
 *
 * @fileoverview VM state management store with SSH auto-discovery
 */

import { derived } from 'svelte/store';
import { createStoreFactory } from './storeFactoryTemplate.js';
import { withLoadingState } from './baseStore.js';
import { getService } from '../core/ServiceContainer.js';

// New Factory Pattern Implementation
const initialState = {
   vms: [],
   selectedVM: null,
   loading: false,
   error: null,
};

function vmStoreLogic(baseStore, dependencies) {
   const { vmService } = dependencies;

   return {
      async loadVMs() {
         return withLoadingState(
            baseStore,
            async () => {
               const vms = await vmService.loadVMs();

               baseStore.update((state) => {
                  let selectedVM = null;

                  if (
                     state.selectedVM &&
                     vms.find((vm) => vm.id === state.selectedVM.id)
                  ) {
                     selectedVM = vms.find(
                        (vm) => vm.id === state.selectedVM.id
                     );
                  } else {
                     const lastSelectedVMId =
                        localStorage.getItem("lastSelectedVMId");
                     if (lastSelectedVMId) {
                        selectedVM =
                           vms.find((vm) => vm.id === lastSelectedVMId) || null;
                     }
                  }

                  return {
                     ...state,
                     vms,
                     selectedVM,
                  };
               });

               return vms;
            },
            { operationName: "loadVMs", logOperation: true }
         );
      },

      async testConnection(alias) {
         return withLoadingState(
            baseStore,
            async () => {
               return await vmService.testConnection(alias);
            },
            { operationName: `testConnection(${alias})`, logOperation: true }
         );
      },

      async refreshVMs() {
         return this.loadVMs();
      },

      selectVM(vm) {
         baseStore.setState({ selectedVM: vm });
         if (vm) {
            localStorage.setItem("lastSelectedVMId", vm.id);
            this.updateSelectionHistory(vm.id);
         } else {
            localStorage.removeItem("lastSelectedVMId");
         }
      },

      updateSelectionHistory(vmId) {
         const historyKey = "vmSelectionHistory";
         let history = [];

         try {
            const stored = localStorage.getItem(historyKey);
            history = stored ? JSON.parse(stored) : [];
         } catch (e) {
            history = [];
         }

         history = history.filter((id) => id !== vmId);
         history.unshift(vmId);
         history = history.slice(0, 10);

         localStorage.setItem(historyKey, JSON.stringify(history));
      },

      getSelectionHistory() {
         try {
            const stored = localStorage.getItem("vmSelectionHistory");
            return stored ? JSON.parse(stored) : [];
         } catch (e) {
            return [];
         }
      },

      getVMById(id) {
         const state = baseStore.getValue();
         return state.vms.find((vm) => vm.id === id) || null;
      },

      getVMsByEnvironment(environment) {
         const state = baseStore.getValue();
         return state.vms.filter((vm) => vm.environment === environment);
      },

      /**
       * Convenience helper triggered by UI when user wants to manage commands for a VM.
       * Selects the VM and ensures its commands are loaded via commandStore.
       * @param {Object} vm - VM object
       */
      async manageCommands(vm) {
         if (!vm) return;
         // Select VM first so rest of UI reacts
         this.selectVM(vm);
         try {
           const { storesContainer } = await import('./StoresContainer.js');
           const commandStore = await storesContainer.get('commandStore');
           await commandStore.loadVMCommands(vm.id);
         } catch (err) {
           console.error('[vmStore] manageCommands failed:', err);
         }
      },

      /**
       * Placeholder for future VM editing functionality (currently read-only).
       */
      async editVM(/* vm */) {
         console.warn('[vmStore] editVM is not supported for auto-discovered VMs');
      },

      /**
       * Placeholder for future VM deletion functionality (currently read-only).
       */
      async deleteVM(/* vm */) {
         console.warn('[vmStore] deleteVM is not supported for auto-discovered VMs');
      },
   };
}
// Keep only the factory export
export const createVMStoreFactory = createStoreFactory('VMStore', initialState, vmStoreLogic);

// Add helper for creating derived stores from factory instances
export function createVMDerivedStores(vmStoreInstance) {
  return {
    vms: derived(vmStoreInstance, ($store) => $store.vms),
    selectedVM: derived(vmStoreInstance, ($store) => $store.selectedVM),
    vmLoading: derived(vmStoreInstance, ($store) => $store.loading),
    vmError: derived(vmStoreInstance, ($store) => $store.error)
  };
}
