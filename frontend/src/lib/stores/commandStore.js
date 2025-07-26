/**
 * Command Store
 *
 * Svelte store for managing command state and operations.
 * Provides reactive state management for command CRUD operations.
 *
 * @fileoverview Command state management store
 */

import { writable, derived } from 'svelte/store';
import { commandService } from '../services/ApiService.js';
import { selectedVM } from './vmStore.js';

/**
 * Create command store with reactive state management
 */
function createCommandStore() {
  // Core state
  const { subscribe, set, update } = writable({
    commands: [],
    commandsByVM: {}, // Cache commands by VM ID
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load commands for a specific VM
     * @param {string} vmId - VM ID
     */
    async loadVMCommands(vmId) {
      if (!vmId) return;
      
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const commands = await commandService.getVMCommands(vmId);
        update(state => ({ 
          ...state, 
          commands,
          commandsByVM: {
            ...state.commandsByVM,
            [vmId]: commands
          },
          loading: false 
        }));
      } catch (error) {
        console.error('Failed to load VM commands:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: error.message 
        }));
      }
    },

    /**
     * Create a new command for a VM
     * @param {string} vmId - VM ID
     * @param {Object} commandData - Command data
     */
    async createCommand(vmId, commandData) {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const newCommand = await commandService.createCommand(vmId, commandData);
        update(state => {
          const vmCommands = state.commandsByVM[vmId] || [];
          const updatedCommands = [...vmCommands, newCommand];
          
          return {
            ...state,
            commands: state.commands.concat(newCommand),
            commandsByVM: {
              ...state.commandsByVM,
              [vmId]: updatedCommands
            },
            loading: false
          };
        });
        return newCommand;
      } catch (error) {
        console.error('Failed to create command:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: error.message 
        }));
        throw error;
      }
    },

    /**
     * Update an existing command
     * @param {string} id - Command ID
     * @param {Object} updates - Command updates
     */
    async updateCommand(id, updates) {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const updatedCommand = await commandService.updateCommand(id, updates);
        update(state => {
          const newCommandsByVM = { ...state.commandsByVM };
          
          // Update command in all VM caches
          Object.keys(newCommandsByVM).forEach(vmId => {
            newCommandsByVM[vmId] = newCommandsByVM[vmId].map(cmd => 
              cmd.id === id ? updatedCommand : cmd
            );
          });

          return {
            ...state,
            commands: state.commands.map(cmd => cmd.id === id ? updatedCommand : cmd),
            commandsByVM: newCommandsByVM,
            loading: false
          };
        });
        return updatedCommand;
      } catch (error) {
        console.error('Failed to update command:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: error.message 
        }));
        throw error;
      }
    },

    /**
     * Delete a command
     * @param {string} id - Command ID
     * @param {string} vmId - VM ID (for cache management)
     */
    async deleteCommand(id, vmId) {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        await commandService.deleteCommand(id);
        update(state => {
          const newCommandsByVM = { ...state.commandsByVM };
          
          // Remove command from all VM caches
          Object.keys(newCommandsByVM).forEach(vmIdKey => {
            newCommandsByVM[vmIdKey] = newCommandsByVM[vmIdKey].filter(cmd => cmd.id !== id);
          });

          return {
            ...state,
            commands: state.commands.filter(cmd => cmd.id !== id),
            commandsByVM: newCommandsByVM,
            loading: false
          };
        });
      } catch (error) {
        console.error('Failed to delete command:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: error.message 
        }));
        throw error;
      }
    },

    /**
     * Get commands for a specific VM from cache
     * @param {string} vmId - VM ID
     * @returns {Array} Commands for the VM
     */
    getVMCommands(vmId) {
      let commands = [];
      const unsubscribe = subscribe(state => {
        commands = state.commandsByVM[vmId] || [];
      });
      unsubscribe();
      return commands;
    },

    /**
     * Clear error state
     */
    clearError() {
      update(state => ({ ...state, error: null }));
    },

    /**
     * Reset store to initial state
     */
    reset() {
      set({
        commands: [],
        commandsByVM: {},
        loading: false,
        error: null,
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

// Derived store for current VM's commands
export const currentVMCommands = derived(
  [commandStore, selectedVM],
  ([$commandStore, $selectedVM]) => {
    if (!$selectedVM) return [];
    return $commandStore.commandsByVM[$selectedVM.id] || [];
  }
);

// Derived store for command groups (organized by type)
export const commandGroups = derived(currentVMCommands, $commands => {
  const groups = {
    stream: { type: 'stream', description: 'Streaming commands', commands: [] },
    ssh: { type: 'ssh', description: 'SSH commands', commands: [] },
    terminal: { type: 'terminal', description: 'Terminal commands', commands: [] }
  };

  $commands.forEach(command => {
    if (groups[command.type]) {
      groups[command.type].commands.push(command);
    }
  });

  // Only return groups that have commands
  return Object.fromEntries(
    Object.entries(groups).filter(([_, group]) => group.commands.length > 0)
  );
});
