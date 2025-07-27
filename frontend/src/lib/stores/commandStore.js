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
import { selectedVM } from "./vmStore.js";

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

               console.log('🔍 Loading commands for VM ID:', vmId);

               // Resolve to backend UUID if necessary
               const backendVM = await vmService.ensureRegistered(vmId);
               const vmCommands = await commandService.listVMCommands(backendVM.id);
               console.log('📋 Commands loaded:', vmCommands);

               baseStore.updateWithLoading(
                  (state) => ({
                     ...state,
                     vmCommands,
                     commandsByVM: {
                        ...state.commandsByVM,
                        [vmId]: vmCommands,
                     },
                  }),
                  false
               );

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

               baseStore.updateWithLoading(
                  (state) => ({
                     ...state,
                     availableTemplates,
                  }),
                  false
               );

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
               const newCommand = await commandService.createCommand(backendVM.id, commandData);

               baseStore.updateWithLoading((state) => {
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
               }, false);

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
               const updatedCommand = await commandService.updateCommand(commandId, updates);

               baseStore.updateWithLoading((state) => {
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
               }, false);

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

               baseStore.updateWithLoading((state) => {
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
               }, false);
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

// Create and export the store instance
export const commandStore = createCommandStore();

// Derived stores for convenience
export const vmCommands = derived(
   commandStore,
   ($commandStore) => $commandStore.vmCommands
);

export const availableTemplates = derived(
   commandStore,
   ($commandStore) => $commandStore.availableTemplates
);

export const commandLoading = derived(
   commandStore,
   ($commandStore) => $commandStore.loading
);
export const commandError = derived(
   commandStore,
   ($commandStore) => $commandStore.error
);

// Derived store for current VM commands
export const currentVMCommands = derived(
   [commandStore, selectedVM],
   ([$commandStore, $selectedVM]) => {
      if (!$selectedVM) return [];
      return $commandStore.commandsByVM[$selectedVM.id] || [];
   }
);

// Additional derived stores for VM commands
export const vmCommandsByType = derived(vmCommands, ($vmCommands) => {
   const grouped = {};
   $vmCommands.forEach((cmd) => {
      const type = cmd.type || "general";
      if (!grouped[type]) {
         grouped[type] = [];
      }
      grouped[type].push(cmd);
   });
   return grouped;
});

export const hasVMCommands = derived(
   vmCommands,
   ($vmCommands) => $vmCommands.length > 0
);
export const vmCommandCount = derived(
   vmCommands,
   ($vmCommands) => $vmCommands.length
);

// Derived stores for available templates
export const availableTemplatesArray = derived(
   availableTemplates,
   ($templates) => {
      return Object.entries($templates).map(([key, config]) => ({
         id: key,
         name: key,
         cmd: config.cmd,
         type: config.type,
         description: config.description,
         hostAlias: config.hostAlias,
         timeout: config.timeout || 30000,
      }));
   }
);

// Legacy export for backward compatibility (will be removed)
export const commands = vmCommands;
