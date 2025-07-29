/* src/lib/state/stores.state.svelte.js */
import { storesContainer } from '$lib/stores/StoresContainer.js';

/* ── private reactive fields ── */
let _vmStore      = $state(null);
let _commandStore = $state(null);
let _jobStore     = $state(null);

/* ── public read-only accessors ── */
export function getVMStore()      { return _vmStore; }
export function getCommandStore() { return _commandStore; }
export function getJobStore()     { return _jobStore; }

let initPromise = null;
export function initStores() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    _vmStore      = await storesContainer.get('vmStore');
    _commandStore = await storesContainer.get('commandStore');
    _jobStore     = await storesContainer.get('jobStore');

    /* wire them into the UI state once */
    const uiState = await import('$lib/state/ui.state.svelte.js');
    uiState.attachStores({
      vmStoreRef: _vmStore,
      commandStoreRef: _commandStore,
      jobStoreRef: _jobStore
    });
  })();
  return initPromise;
}

/* auto-initialise in the browser */
if (typeof window !== 'undefined') initStores();
