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
   const { commandService, vmService, commandExecutor } = dependencies;
   const store = createCRUDStore(initialState);

   return {
      /* Svelte store contract */
      subscribe: store.subscribe,
      getState: store.getState,
      getValue: store.getState, // legacy alias

      /* ───────── business methods ───────── */
      async loadVMCommands(vmId) {
         if (!vmId) return [];

         try {
            const backendVM = await vmService.ensureRegistered(vmId);
            const vmCommands = await commandService.listVMCommands(backendVM.id);

            const state = store.getState();
            store.set({
               ...state,
               vmCommands,
               commandsByVM: { ...state.commandsByVM, [vmId]: vmCommands },
            });
            return vmCommands;
         } catch (error) {
            console.error('Failed to load VM commands:', error);
            throw error;
         }
      },

      async loadAvailableCommandTemplates() {
         try {
            const commandTemplates = await commandService.getCommandTemplates();
            store.update((s) => ({
               ...s,
               availableCommandTemplates: commandTemplates,
            }));
            return commandTemplates;
         } catch (error) {
            console.error('Failed to load command templates:', error);
            throw error;
         }
      },

      async createCommand(vmId, data) {
         if (!vmId) throw new Error("VM id required");

         try {
            const backendVM = await vmService.ensureRegistered(vmId);
            const newCommand = await commandService.createCommand(backendVM.id, data);

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
         } catch (error) {
            console.error('Failed to create command:', error);
            throw error;
         }
      },

      async updateCommand(commandId, updateData) {
         console.log('🔄 CommandStore: Updating command via API:', commandId, updateData);
         
         try {
            const updatedCommand = await commandService.updateCommand(commandId, updateData);
            console.log('📡 CommandStore: API update successful:', updatedCommand);
            
            store.update((s) => {
               // Update in vmCommands array
               const vmCommandsUpdated = s.vmCommands.map(cmd => 
                  cmd.id === commandId ? updatedCommand : cmd
               );
               
               // Update in commandsByVM object
               const commandsByVMUpdated = { ...s.commandsByVM };
               Object.keys(commandsByVMUpdated).forEach(vmId => {
                  commandsByVMUpdated[vmId] = commandsByVMUpdated[vmId].map(cmd =>
                     cmd.id === commandId ? updatedCommand : cmd
                  );
               });
               
               return {
                  ...s,
                  vmCommands: vmCommandsUpdated,
                  commandsByVM: commandsByVMUpdated,
               };
            });
            
            console.log('✅ CommandStore: Command updated successfully');
            return updatedCommand;
         } catch (error) {
            console.error('❌ CommandStore: Failed to update command:', error);
            throw error;
         }
      },

      async deleteCommand(commandId) {
         console.log('🗑️ CommandStore: Deleting command via API:', commandId);
         
         try {
            await commandService.deleteCommand(commandId);
            console.log('📡 CommandStore: API delete successful');
            
            store.update((s) => {
               // Remove from vmCommands array
               const vmCommandsUpdated = s.vmCommands.filter(cmd => cmd.id !== commandId);
               
               // Remove from commandsByVM object
               const commandsByVMUpdated = { ...s.commandsByVM };
               Object.keys(commandsByVMUpdated).forEach(vmId => {
                  commandsByVMUpdated[vmId] = commandsByVMUpdated[vmId].filter(cmd => cmd.id !== commandId);
               });
               
               return {
                  ...s,
                  vmCommands: vmCommandsUpdated,
                  commandsByVM: commandsByVMUpdated,
               };
            });
            
            console.log('✅ CommandStore: Command deleted successfully');
         } catch (error) {
            console.error('❌ CommandStore: Failed to delete command:', error);
            throw error;
         }
      },

      /* ───────── execution delegation to CommandExecutor ───────── */
      async executeCommand(selectedVM, command, options = {}) {
         if (!commandExecutor) {
            throw new Error('CommandExecutor not available');
         }
         return await commandExecutor.executeCommand(selectedVM, command, options);
      },

      // Execution state access
      getIsExecuting() {
         return commandExecutor?.getIsExecuting();
      },

      getCurrentExecution() {
         return commandExecutor?.getCurrentExecution();
      },

      getExecutionHistory() {
         return commandExecutor?.getExecutionHistory();
      },

      getExecutionStats() {
         return commandExecutor?.getExecutionStats();
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
