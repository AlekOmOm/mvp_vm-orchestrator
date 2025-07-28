/**
 * Command Store
 *
 * Enhanced command store using base store pattern for consistent state management.
 * Provides reactive state management for command CRUD operations.
 *
 * @fileoverview Command state management store
 */

import { derived } from "svelte/store";
import { createBaseStore, withLoadingState } from "./baseStore.js";
import { getService } from "../core/ServiceContainer.js";
import { createStoreFactory } from "./storeFactoryTemplate.js";

/**
 * Create command store with enhanced base store functionality
 */
function createCommandStore() {
   // Initial state
   const initialState = {
      // VM-specific commands (actual configured commands)
      vmCommands: [],
      commandsByVM: {}, // Cache commands by VM ID

      // Available command templates (for suggestions only)
      availableTemplates: {},

      loading: false,
      error: null,
   };

   // Create base store with logging enabled
   const baseStore = createBaseStore(initialState, {
      name: "CommandStore",
      enableLogging: true,
   });

   return {
      ...baseStore,

      /**
       * Load commands for a specific VM
       * @param {string} vmId - VM ID
       */
      async loadVMCommands(vmId) {
         if (!vmId) return;

         return withLoadingState(
            baseStore,
            async () => {
               const commandService = getService("commandService");
               const vmService = getService("vmService");

               console.log("🔍 Loading commands for VM ID:", vmId);

               // Resolve to backend UUID if necessary
               const backendVM = await vmService.ensureRegistered(vmId);
               const vmCommands = await commandService.listVMCommands(
                  backendVM.id
               );
               console.log("📋 Commands loaded:", vmCommands);

               baseStore.setState({
                  vmCommands,
                  commandsByVM: {
                     ...baseStore.getValue().commandsByVM,
                     [vmId]: vmCommands,
                  },
               });

               return vmCommands;
            },
            { operationName: `loadVMCommands(${vmId})`, logOperation: true }
         );
      },

      /**
       * Load available command templates (for suggestions only)
       */
      async loadAvailableTemplates() {
         return withLoadingState(
            baseStore,
            async () => {
               const commandService = getService("commandService");
               const availableTemplates = await commandService.getTemplates();

               baseStore.update((state) => ({
                  ...state,
                  availableTemplates,
               }));

               return availableTemplates;
            },
            { operationName: "loadAvailableTemplates", logOperation: true }
         );
      },

      /**
       * Create a new command for a VM
       * @param {string} vmId - VM ID
       * @param {Object} commandData - Command data
       */
      async createCommand(vmId, commandData) {
         if (!vmId) throw new Error("VM ID is required");

         return withLoadingState(
            baseStore,
            async () => {
               const commandService = getService("commandService");
               const vmService = getService("vmService");
               // Ensure VM is registered and obtain backend id (uuid)
               const backendVM = await vmService.ensureRegistered(vmId);
               const newCommand = await commandService.createCommand(
                  backendVM.id,
                  commandData
               );

               baseStore.update((state) => {
                  const vmCommands = state.commandsByVM[vmId] || [];
                  const updatedCommands = [...vmCommands, newCommand];

                  return {
                     ...state,
                     vmCommands: state.vmCommands.concat(newCommand),
                     commandsByVM: {
                        ...state.commandsByVM,
                        [vmId]: updatedCommands,
                     },
                  };
               });

               return newCommand;
            },
            { operationName: `createCommand(${vmId})`, logOperation: true }
         );
      },

      /**
       * Update an existing command
       * @param {string} commandId - Command ID
       * @param {Object} updates - Command updates
       */
      async updateCommand(commandId, updates) {
         return withLoadingState(
            baseStore,
            async () => {
               const commandService = getService("commandService");
               const updatedCommand = await commandService.updateCommand(
                  commandId,
                  updates
               );

               baseStore.update((state) => {
                  // Update in main vmCommands array
                  const updatedVMCommands = state.vmCommands.map((cmd) =>
                     cmd.id === commandId ? updatedCommand : cmd
                  );

                  // Update in VM-specific cache
                  const updatedCommandsByVM = { ...state.commandsByVM };
                  Object.keys(updatedCommandsByVM).forEach((vmId) => {
                     updatedCommandsByVM[vmId] = updatedCommandsByVM[vmId].map(
                        (cmd) => (cmd.id === commandId ? updatedCommand : cmd)
                     );
                  });

                  return {
                     ...state,
                     vmCommands: updatedVMCommands,
                     commandsByVM: updatedCommandsByVM,
                  };
               });

               return updatedCommand;
            },
            { operationName: "updateCommand", logOperation: true }
         );
      },

      /**
       * Delete a command
       * @param {string} commandId - Command ID
       */
      async deleteCommand(commandId) {
         return withLoadingState(
            baseStore,
            async () => {
               const commandService = getService("commandService");
               await commandService.deleteCommand(commandId);

               baseStore.update((state) => {
                  // Remove from main vmCommands array
                  const filteredVMCommands = state.vmCommands.filter(
                     (cmd) => cmd.id !== commandId
                  );

                  // Remove from VM-specific cache
                  const updatedCommandsByVM = { ...state.commandsByVM };
                  Object.keys(updatedCommandsByVM).forEach((vmId) => {
                     updatedCommandsByVM[vmId] = updatedCommandsByVM[
                        vmId
                     ].filter((cmd) => cmd.id !== commandId);
                  });

                  return {
                     ...state,
                     vmCommands: filteredVMCommands,
                     commandsByVM: updatedCommandsByVM,
                  };
               });
            },
            { operationName: "deleteCommand", logOperation: true }
         );
      },

      /**
       * Get commands for a specific VM
       * @param {string} vmId - VM ID
       * @returns {Array} Commands for the VM
       */
      getCommandsForVM(vmId) {
         const state = baseStore.getValue();
         return state.commandsByVM[vmId] || [];
      },

      /**
       * Get command by ID
       * @param {string} commandId - Command ID
       * @returns {Object|null} Command object or null
       */
      getCommandById(commandId) {
         const state = baseStore.getValue();
         return state.vmCommands.find((cmd) => cmd.id === commandId) || null;
      },

      /**
       * Clear commands cache
       */
      clearCommands() {
         baseStore.setState({
            vmCommands: [],
            commandsByVM: {},
         });
      },
   };
}

// ❌ REMOVED: Singleton store exports - use factory pattern via StoresContainer instead
// Components should access stores via: await storesContainer.get('commandStore')

const initialState = {
   vmCommands: [],
   commandsByVM: {},
   availableTemplates: {},
   loading: false,
   error: null,
};

function commandStoreLogic(baseStore, dependencies) {
   const { commandService, vmService } = dependencies;

   return {
      async loadVMCommands(vmId) {
         if (!vmId) return;
         return withLoadingState(baseStore, async () => {
            const backendVM = await vmService.ensureRegistered(vmId);
            const vmCommands = await commandService.listVMCommands(
               backendVM.id
            );
            baseStore.setState({
               vmCommands,
               commandsByVM: {
                  ...baseStore.getValue().commandsByVM,
                  [vmId]: vmCommands,
               },
            });
            return vmCommands;
         });
      },

      async loadAvailableTemplates() {
         return withLoadingState(baseStore, async () => {
            const availableTemplates = await commandService.getTemplates();
            baseStore.update((state) => ({ ...state, availableTemplates }));
            return availableTemplates;
         });
      },

      async createCommand(vmId, commandData) {
         if (!vmId) throw new Error("VM ID is required");
         return withLoadingState(baseStore, async () => {
            const backendVM = await vmService.ensureRegistered(vmId);
            const newCommand = await commandService.createCommand(
               backendVM.id,
               commandData
            );
            baseStore.update((state) => {
               const vmCommands = state.commandsByVM[vmId] || [];
               return {
                  ...state,
                  vmCommands: state.vmCommands.concat(newCommand),
                  commandsByVM: {
                     ...state.commandsByVM,
                     [vmId]: [...vmCommands, newCommand],
                  },
               };
            });
            return newCommand;
         });
      },

      async updateCommand(commandId, updates) {
         return withLoadingState(baseStore, async () => {
            const updatedCommand = await commandService.updateCommand(
               commandId,
               updates
            );
            baseStore.update((state) => {
               const updatedVMCommands = state.vmCommands.map((c) =>
                  c.id === commandId ? updatedCommand : c
               );
               const updatedByVM = { ...state.commandsByVM };
               Object.keys(updatedByVM).forEach((id) => {
                  updatedByVM[id] = updatedByVM[id].map((c) =>
                     c.id === commandId ? updatedCommand : c
                  );
               });
               return {
                  ...state,
                  vmCommands: updatedVMCommands,
                  commandsByVM: updatedByVM,
               };
            });
            return updatedCommand;
         });
      },

      async deleteCommand(commandId) {
         return withLoadingState(baseStore, async () => {
            await commandService.deleteCommand(commandId);
            baseStore.update((state) => {
               const filtered = state.vmCommands.filter(
                  (c) => c.id !== commandId
               );
               const updatedByVM = { ...state.commandsByVM };
               Object.keys(updatedByVM).forEach((id) => {
                  updatedByVM[id] = updatedByVM[id].filter(
                     (c) => c.id !== commandId
                  );
               });
               return {
                  ...state,
                  vmCommands: filtered,
                  commandsByVM: updatedByVM,
               };
            });
         });
      },

      getCommandsForVM(vmId) {
         const state = baseStore.getValue();
         return state.commandsByVM[vmId] || [];
      },

      getCommandById(commandId) {
         const state = baseStore.getValue();
         return state.vmCommands.find((c) => c.id === commandId) || null;
      },

      clearCommands() {
         baseStore.setState({ vmCommands: [], commandsByVM: {} });
      },
   };
}

export const createCommandStoreFactory = createStoreFactory(
   "CommandStore",
   initialState,
   commandStoreLogic
);
