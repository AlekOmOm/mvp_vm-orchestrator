/**
 * VM Store - Direct instance implementation
 *
 * This store is now managed through the ServiceContainer and accessed
 * via stores.state.svelte.js. This file provides the store factory
 * for the new dependency injection system.
 */

import { createCRUDStore } from "./crudStore.js";

const initialState = {
   vms: null,
   loading: false,
   error: null,
};

export function createVMStore(dependencies) {
   const { vmService } = dependencies;
   const store = createCRUDStore(initialState);

   return {
      // Svelte store contract
      subscribe: store.subscribe,
      getState: store.getState,

      // Direct state access for runes
      getVMByAlias(alias) {
         if (!alias) return null;
         let vm = store.getState().vms?.find((vm) => vm.alias === alias);
         if (!vm || !vm.id) {
            // VM not registered, ensure registration to get UUID
            vm = vmService.ensureRegistered(alias);
            store.update((state) => ({
               ...state,
               vms: [...(state.vms || []), vm],
            }));
         }
         return vm;
      },
      getVMById(uuid) {
         if (!uuid) return null; // Handle null IDs gracefully
         return store.getState().vms?.find((vm) => vm.id === uuid) || null;
      },
      async resolveVM(identifier) {
         if (!identifier) return null;

         let vm = null;
         vm = this.getVMByAlias(identifier);

         if (vm === null && identifier.length > 10 && identifier.includes('-')) {
            vm = this.getVMById(identifier);
         }
         return vm;
      },
      getVMs() {
         return store.getState().vms;
      },
      getError() {
         return store.getState().error;
      },

      // Methods
      async loadVMs(forceRefresh = false) {
         store.update((state) => ({ ...state, loading: true, error: null }));

         try {
            const vms = await vmService.loadVMs(forceRefresh);
            store.update((state) => ({
               vms,
               loading: false,
               error: null,
            }));
            return vms;
         } catch (error) {
            console.error("Failed to load VMs:", error);
            store.update((state) => ({
               ...state,
               loading: false,
               error: error.message,
            }));
            throw error;
         }
      },
   };
}
