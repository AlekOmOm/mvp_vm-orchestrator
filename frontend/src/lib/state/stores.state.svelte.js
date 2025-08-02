/* src/lib/state/stores.state.svelte.js */
import { getService } from "$lib/core/ServiceContainer.js";
import { createVMStore } from "$lib/stores/vmStore.js";
import { createCommandStore } from "$lib/stores/commandStore.js";
import { createJobStore } from "$lib/stores/jobStore.js";
import { createLogStore } from "$lib/stores/logStore.js";
import { attachStores } from './ui.state.svelte.js';

/* ── private reactive fields ── */
let _vmStore = $state(null);
let _commandStore = $state(null);
let _jobStore = $state(null);
let _logStore = $state(null);

/* ── public read-only accessors ── */
export function getVMStore() {
   return _vmStore;
}
export function getCommandStore() {
   return _commandStore;
}
export function getJobStore() {
   return _jobStore;
}
export function getLogStore() {
   return _logStore;
}

let initPromise = null;
let dataInitPromise = null;

export function initStores() {
   if (initPromise) return initPromise;
   initPromise = (async () => {
      const vmService = getService("vmService");
      const commandService = getService("commandService");
      const commandExecutor = getService("commandExecutor");

      console.log('🏪 Initializing stores with services:', { vmService, commandService, commandExecutor });

      _vmStore = createVMStore({ vmService });
      _commandStore = createCommandStore({ commandService, vmService, commandExecutor });
      _jobStore = createJobStore();
      _logStore = createLogStore();

      console.log('🏪 Stores initialized. CommandStore methods:', Object.keys(_commandStore));
   })();
   return initPromise;
}

// Separate data initialization from store creation
export async function initializeStoresData() {
   if (dataInitPromise) return dataInitPromise;
   
   dataInitPromise = (async () => {
      await initStores();
      
      // Attach stores to UI state for reactivity - ONLY ONCE
      attachStores({
         vmStoreRef: _vmStore,
         commandStoreRef: _commandStore, 
         jobStoreRef: _jobStore
      });
      
      console.log('🔄 Initializing store data...');
      
      // Load global data that all components need
      const loadPromises = [];
      
      if (_vmStore) {
         loadPromises.push(_vmStore.loadVMs().catch(err => 
            console.error('Failed to load VMs:', err)
         ));
      }
      
      if (_jobStore?.loadJobs) {
         loadPromises.push(_jobStore.loadJobs().catch(err => 
            console.error('Failed to load jobs:', err)
         ));
      }
      
      if (_commandStore?.loadAvailableCommandTemplates) {
         loadPromises.push(_commandStore.loadAvailableCommandTemplates().catch(err => 
            console.error('Failed to load command templates:', err)
         ));
      }
      
      await Promise.all(loadPromises);
      console.log('✅ Store data initialized');
   })();
   
   return dataInitPromise;
}

/* auto-initialise in the browser */
if (typeof window !== "undefined") initStores();
