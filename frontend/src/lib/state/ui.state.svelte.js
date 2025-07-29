/* src/lib/state/ui.state.svelte.js
 *
 * UI state singleton with private $state and public accessors
 */

/* ── private reactive fields ── */
let _selectedVMId        = $state(null);
let _selectedVM          = $state(null);
let _selectedVMCommands  = $state([]);
let _selectedVMJobs      = $state([]);

/* ── public read-only accessors ── */
export function getSelectedVMId()       { return _selectedVMId; }
export function getSelectedVM()         { return _selectedVM; }
export function getSelectedVMCommands() { return _selectedVMCommands; }
export function getSelectedVMJobs()     { return _selectedVMJobs; }

/* ── public actions that mutate state ── */
export function selectVM(id) {
  _selectedVMId = id;
  if (id) localStorage.setItem('lastSelectedVMId', id);
  else     localStorage.removeItem('lastSelectedVMId');
}

/* ── internal APIs for store integration ── */
export function _setSelectedVM(vm) {
  _selectedVM = vm;
}

export function _setSelectedVMCommands(commands) {
  _selectedVMCommands = commands;
}

export function _setSelectedVMJobs(jobs) {
  _selectedVMJobs = jobs;
}

/* ── store injection (called once) ── */
let vmStore, commandStore, jobStore;
export function attachStores({ vmStoreRef, commandStoreRef, jobStoreRef }) {
  vmStore     = vmStoreRef;
  commandStore = commandStoreRef;
  jobStore     = jobStoreRef;

  /* if a VM was already chosen before the stores existed, refresh it */
  if (_selectedVMId) refreshSelectedVM(_selectedVMId);
}

/* ── derive the rest whenever id changes ── */
let lastId = null;
$effect(() => {
  if (!vmStore || !commandStore || !jobStore || !_selectedVMId) return;

  if (_selectedVMId !== lastId) {
    lastId = _selectedVMId;

    /* 1. synchronous data that might be cached */
    _selectedVM         = vmStore.getVMById(_selectedVMId);
    _selectedVMCommands = commandStore.getCommandsForVM(_selectedVMId);
    _selectedVMJobs     = jobStore.getVMJobs?.(_selectedVMId) ?? [];

    /* 2. async refreshes (fire-and-forget, update when done) */
    commandStore.loadVMCommands(_selectedVMId).then(() => {
      _selectedVMCommands = commandStore.getCommandsForVM(_selectedVMId);
    });

    jobStore.loadVMJobs?.(_selectedVMId).then(() => {
      _selectedVMJobs = jobStore.getVMJobs(_selectedVMId);
    });
  }
});

/* helper that can be reused inside this module */
function refreshSelectedVM(id) {
  _selectedVMId = id;
}
