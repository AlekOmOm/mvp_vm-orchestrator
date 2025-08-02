/* src/lib/stores/commandStore.js */
import { createCRUDStore } from "$lib/stores/crudStore.js";

/* initial shape --------------------------------------------------- */
const initialState = {
   vmCommands: [],
   commandsByVM: {},
   availableCommandTemplates: {},
   loading: false,
   error: null,
};

/* store factory -------------------------------------------------- */
export function createCommandStore(dependencies) {
   const { commandService, vmService } = dependencies;
   const store = createCRUDStore(initialState);

   return {
      /* Svelte store contract */
      subscribe: store.subscribe,
      getState: store.getState,
      getValue: store.getState, // legacy alias

      /* ───────── business methods ───────── */
      async loadVMCommands(vmId) {
         if (!vmId) return [];

         const backendVM = await vmService.ensureRegistered(vmId);
         const vmCommands = await commandService.listVMCommands(backendVM.id);

         const state = store.getState();
         store.set({
            ...state,
            vmCommands,
            commandsByVM: { ...state.commandsByVM, [vmId]: vmCommands },
         });
         return vmCommands;
      },

      async loadAvailableCommandTemplates() {
         const commandTemplates = await commandService.getCommandTemplates();
         store.update((s) => ({
            ...s,
            availableCommandTemplates: commandTemplates,
         }));
         return commandTemplates;
      },

      async createCommand(vmId, data) {
         if (!vmId) throw new Error("VM id required");

         const backendVM = await vmService.ensureRegistered(vmId);
         const newCommand = await commandService.createCommand(
            backendVM.id,
            data
         );

         store.update((s) => {
            const vmCmds = s.commandsByVM[vmId] ?? [];
            return {
               ...s,
               vmCommands: s.vmCommands.concat(newCommand),
               commandsByVM: {
                  ...s.commandsByVM,
                  [vmId]: vmCmds.concat(newCommand),
               },
            };
         });
         return newCommand;
      },

      getCommandsForVM(vmId) {
         return store.getState().commandsByVM[vmId] ?? [];
      },

      clearCommands() {
         store.set({
            ...initialState,
            availableCommandTemplates: {},
         });
      },

      getAvailableCommandTemplates() {
         return store.getState().availableCommandTemplates;
      },
   };
}
