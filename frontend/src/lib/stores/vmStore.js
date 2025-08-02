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

      // Direct state access for runes
      get vms() {
         return store.getState().vms;
      },
      get loading() {
         return store.getState().loading;
      },
      get error() {
         return store.getState().error;
      },

      // Methods
      async loadVMs(forceRefresh = false) {
         store.update((state) => ({ ...state, loading: true, error: null }));

         try {
            const vms = await vmService.loadVMs(forceRefresh);
            console.log("VMs loaded:", vms.length);
            store.update((state) => ({
               ...state,
               vms,
               loading: false,
               error: null,
            }));
            console.log("VMs loaded:", vms.length);
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

      getVMById(id) {
         return this.vms?.find((vm) => vm.id === id) || null;
      },
   };
}
