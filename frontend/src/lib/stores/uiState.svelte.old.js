import { writable } from 'svelte/store';
import { storesContainer } from './StoresContainer.js';
const commandStore = storesContainer.get('commandStore');

function createUIState() {
  const { subscribe, set, update } = writable({
    selectedVMId: null,
    selectedVMCommands: [],
  });

  return {
    subscribe,
    selectVM: (vmId) => {
      update(state => ({ ...state, selectedVMId: vmId }));
      if (vmId) {
        localStorage.setItem('lastSelectedVMId', vmId);
        updateSelectedVMCommands();
      } else {
        localStorage.removeItem('lastSelectedVMId');
      }
    },

    // get jobs for selected VM
    getJobsForSelectedVM: () => {
      return jobStore.getJobsForVM(state.selectedVMId);
    },

    // get commands for selected VM
    getCommandsForSelectedVM: () => {
      return commandStore.getVMCommands(state.selectedVMId);
    },
    
    initialize: () => {
      const lastSelectedVMId = localStorage.getItem('lastSelectedVMId');
      if (lastSelectedVMId) {
        update(state => ({ ...state, selectedVMId: lastSelectedVMId }));
      }
    }
  };
}

function updateSelectedVMCommands() {
    update(state => ({ ...state, selectedVMCommands: commandStore.getVMCommands(state.selectedVMId) }));
}

export const uiState = createUIState(); 

