/**
 * VM Store - Minimal implementation
 */

import { createCRUDStore } from "./crudStore.js";

const initialState = {
   vms: [],
   selectedVM: null,
   error: null,
};

function createVMStore(dependencies) {
   const { vmService } = dependencies;
   const store = createCRUDStore(initialState, vmService);

   return {
      ...store,

      async loadVMs() {
         try {
            const vms = await vmService.loadVMs();
            store.update(state => ({ ...state, vms, error: null }));
            return vms;
         } catch (error) {
            store.update(state => ({ ...state, error: error.message }));
            throw error;
         }
      },

      selectVM(vm) {
         store.update(state => ({ ...state, selectedVM: vm }));
         if (vm) localStorage.setItem("lastSelectedVMId", vm.id);
      },

      getVMById(id) {
         const { vms } = store.getState();
         return vms.find(vm => vm.id === id) || null;
      }
   };
}

export const createVMStoreFactory = () => createVMStore;
