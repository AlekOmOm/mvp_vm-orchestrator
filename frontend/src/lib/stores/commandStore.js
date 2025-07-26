/**
 * Command Store
 *
 * Enhanced command store using base store pattern for consistent state management.
 * Provides reactive state management for command CRUD operations.
 *
 * @fileoverview Command state management store
 */

import { derived } from 'svelte/store';
import { createBaseStore, withLoadingState } from './baseStore.js';
import { commandService } from '../services/ApiService.js';
import { selectedVM } from './vmStore.js';

/**
 * Create command store with enhanced base store functionality
 */
function createCommandStore() {
  // Initial state
  const initialState = {
    commands: [],
    commandsByVM: {}, // Cache commands by VM ID
    loading: false,
    error: null,
  };

  // Create base store with logging enabled
  const baseStore = createBaseStore(initialState, {
    name: 'CommandStore',
    enableLogging: true
  });

  return {
    ...baseStore,

    /**
     * Load commands for a specific VM
     * @param {string} vmId - VM ID
     */
    async loadVMCommands(vmId) {
      if (!vmId) return;
      
      return withLoadingState(baseStore, async () => {
        const commands = await commandService.getVMCommands(vmId);
        
        baseStore.updateWithLoading(state => ({ 
          ...state, 
          commands,
          commandsByVM: {
            ...state.commandsByVM,
            [vmId]: commands
          }
        }), false);
        
        return commands;
      }, { operationName: `loadVMCommands(${vmId})`, logOperation: true });
    },

    /**
     * Create a new command for a VM
     * @param {string} vmId - VM ID
     * @param {Object} commandData - Command data
     */
    async createCommand(vmId, commandData) {
      return withLoadingState(baseStore, async () => {
        const newCommand = await commandService.createCommand(vmId, commandData);
        
        baseStore.updateWithLoading(state => {
          const vmCommands = state.commandsByVM[vmId] || [];
          const updatedCommands = [...vmCommands, newCommand];
          
          return {
            ...state,
            commands: state.commands.concat(newCommand),
            commandsByVM: {
              ...state.commandsByVM,
              [vmId]: updatedCommands
            }
          };
        }, false);
        
        return newCommand;
      }, { operationName: 'createCommand', logOperation: true });
    },

    /**
     * Update an existing command
     * @param {string} commandId - Command ID
     * @param {Object} updates - Command updates
     */
    async updateCommand(commandId, updates) {
      return withLoadingState(baseStore, async () => {
        const updatedCommand = await commandService.updateCommand(commandId, updates);
        
        baseStore.updateWithLoading(state => {
          // Update in main commands array
          const updatedCommands = state.commands.map(cmd => 
            cmd.id === commandId ? updatedCommand : cmd
          );
          
          // Update in VM-specific cache
          const updatedCommandsByVM = { ...state.commandsByVM };
          Object.keys(updatedCommandsByVM).forEach(vmId => {
            updatedCommandsByVM[vmId] = updatedCommandsByVM[vmId].map(cmd =>
              cmd.id === commandId ? updatedCommand : cmd
            );
          });
          
          return {
            ...state,
            commands: updatedCommands,
            commandsByVM: updatedCommandsByVM
          };
        }, false);
        
        return updatedCommand;
      }, { operationName: 'updateCommand', logOperation: true });
    },

    /**
     * Delete a command
     * @param {string} commandId - Command ID
     */
    async deleteCommand(commandId) {
      return withLoadingState(baseStore, async () => {
        await commandService.deleteCommand(commandId);
        
        baseStore.updateWithLoading(state => {
          // Remove from main commands array
          const filteredCommands = state.commands.filter(cmd => cmd.id !== commandId);
          
          // Remove from VM-specific cache
          const updatedCommandsByVM = { ...state.commandsByVM };
          Object.keys(updatedCommandsByVM).forEach(vmId => {
            updatedCommandsByVM[vmId] = updatedCommandsByVM[vmId].filter(cmd =>
              cmd.id !== commandId
            );
          });
          
          return {
            ...state,
            commands: filteredCommands,
            commandsByVM: updatedCommandsByVM
          };
        }, false);
      }, { operationName: 'deleteCommand', logOperation: true });
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
      return state.commands.find(cmd => cmd.id === commandId) || null;
    },

    /**
     * Clear commands cache
     */
    clearCommands() {
      baseStore.setState({
        commands: [],
        commandsByVM: {}
      });
    }
  };
}

// Create and export the store instance
export const commandStore = createCommandStore();

// Derived stores for convenience
export const commands = derived(commandStore, $commandStore => $commandStore.commands);
export const commandLoading = derived(commandStore, $commandStore => $commandStore.loading);
export const commandError = derived(commandStore, $commandStore => $commandStore.error);

// Derived store for current VM commands
export const currentVMCommands = derived(
  [commandStore, selectedVM], 
  ([$commandStore, $selectedVM]) => {
    if (!$selectedVM) return [];
    return $commandStore.commandsByVM[$selectedVM.id] || [];
  }
);

// Additional derived stores
export const commandsByType = derived(commands, $commands => {
  const grouped = {};
  $commands.forEach(cmd => {
    const type = cmd.type || 'general';
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(cmd);
  });
  return grouped;
});

export const hasCommands = derived(commands, $commands => $commands.length > 0);
export const commandCount = derived(commands, $commands => $commands.length);
