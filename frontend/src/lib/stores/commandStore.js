/* src/lib/stores/commandStore.js */
import { createCRUDStore } from '$lib/stores/createCRUDStore.js';
import { withLoadingState } from '$lib/stores/withLoadingState.js'; // keep the helper

/* plain JS services (already registered in your ServiceContainer) */
import { getService } from '$lib/core/ServiceContainer.js';
const commandService = getService('commandService');
const vmService      = getService('vmService');

/* initial shape --------------------------------------------------- */
const initialState = {
  vmCommands: [],
  commandsByVM: {},
  availableCommandTemplates: {}, // RENAMED: was availableTemplates
  loading: false,
  error: null
};

/* store instance -------------------------------------------------- */
const store = createCRUDStore(initialState);

/* public API identical to the old BaseStore version -------------- */
export const commandStore = {
  /* Svelte store contract */
  subscribe: store.subscribe,

  /* synchronous access */
  getState: store.getState,   // now the official name
  getValue: store.getState,   // legacy alias

  /* ───────── business methods ───────── */

  async loadVMCommands(vmId) {
    if (!vmId) return [];

    return withLoadingState(store, async () => {
      const backendVM  = await vmService.ensureRegistered(vmId);
      const vmCommands = await commandService.listVMCommands(backendVM.id);

      const state = store.getState();
      store.set({
        ...state,
        vmCommands,
        commandsByVM: { ...state.commandsByVM, [vmId]: vmCommands }
      });
      return vmCommands;
    });
  },

  async loadAvailableCommandTemplates() { // RENAMED: was loadAvailableTemplates
    return withLoadingState(store, async () => {
      const commandTemplates = await commandService.getCommandTemplates(); // RENAMED method
      store.update((s) => ({ ...s, availableCommandTemplates: commandTemplates }));
      return commandTemplates;
    });
  },

  async createCommand(vmId, data) {
    if (!vmId) throw new Error('VM id required');

    return withLoadingState(store, async () => {
      const backendVM   = await vmService.ensureRegistered(vmId);
      const newCommand  = await commandService.createCommand(backendVM.id, data);

      store.update((s) => {
        const vmCmds = s.commandsByVM[vmId] ?? [];
        return {
          ...s,
          vmCommands: s.vmCommands.concat(newCommand),
          commandsByVM: {
            ...s.commandsByVM,
            [vmId]: vmCmds.concat(newCommand)
          }
        };
      });
      return newCommand;
    });
  },

  /* updateCommand, deleteCommand  →  identical logic, call store.update() */

  getCommandsForVM(vmId) {
    return store.getState().commandsByVM[vmId] ?? [];
  },

  clearCommands() {
    store.set({
      ...initialState,
      availableCommandTemplates: {} // RENAMED: was availableTemplates
    });
  },

  getAvailableCommandTemplates() {
    return store.getState().availableCommandTemplates;
  }
};
