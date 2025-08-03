/* src/lib/state/ui.state.svelte.js
 *
 * UI state singleton with private $state and public accessors
 */

import { getService } from "$lib/core/ServiceContainer";
import { getVMStore } from "./stores.state.svelte";

/* ── private reactive fields ── */
// vm selected
let _selectedVMId = $state(localStorage.getItem("lastSelectedVMId"));
let _selectedVM = $state(null);
let _selectedVMCommands = $state([]);
let _selectedVMJobs = $state([]);
let _selectedTemplateCmd = $state(null);
let _logLines = $state([]);

// vm being edited
let _editingVM = $state(null);

// modals
let _modalOpen = $state(false);
let _isEditingVMCommands = $state(false);

// command selected
let _selectedCommand = $state(null);
let _editingCommand = $state(null);

/* ── public read-only accessors ── */
export function getSelectedVMId() {
   return _selectedVMId;
}
export function getSelectedVM() {
   if (!_selectedVMId) {
      return null;
   }
   return _selectedVM;
}
export function getSelectedVMCommands() {
   return _selectedVMCommands;
}
function _setSelectedVMCommands(commands) {
   _selectedVMCommands = commands;
}

export function getSelectedVMJobs() {
   return _selectedVMJobs;
}
export function getModalOpen() {
   return _modalOpen;
}
export function getEditingVM() {
   return _editingVM;
}
export function getIsEditingVMCommands() {
   return _isEditingVMCommands;
}
export function getSelectedTemplateCmd() {
   return _selectedTemplateCmd;
}
export function getSelectedCommand() {
   return _selectedCommand;
}

export function getEditingCommand() {
   return _editingCommand;
}
export function getLogLines() {
   return _logLines;
}

/* ── public actions that mutate state ── */
// select functions
export function selectVM(vmPrm) {
   const vm = getVMStore().resolveVM(vmPrm.id || vmPrm.alias);

   // Only store UUID, never alias
   _selectedVMId = vm.id; // This is now guaranteed to be UUID or null
   if (_selectedVMId) localStorage.setItem("lastSelectedVMId", _selectedVMId);
   else localStorage.removeItem("lastSelectedVMId");

   _setSelectedVM(vm);
   if (_selectedVMId) addRecentVM(_selectedVMId);

   const vmCommands = getCommandStore().getCommandsForVM(_selectedVMId);
   _setSelectedVMCommands(vmCommands);

   refreshSelectedVM(vm);
}

export function selectCommand(commandId) {
   _selectedCommand = commandId;
}

export function setSelectedTemplateCmd(template) {
   _selectedTemplateCmd = template;
}
export function setLogLines(lines) {
   _logLines = lines;
}
export function addLogLine(line) {
   _logLines = [..._logLines, ...line];
}

// -------
// modal state change
export function openModal() {
   _modalOpen = true;
}

export function closeModal() {
   _modalOpen = false;
}

// VM edit state change
export function startEdit(vm, type = "vm") {
   if (type === "vm") {
      _editingVM = vm;
      _isEditingVMCommands = false;
   }

   _editingVM = null;
   _isEditingVMCommands = true;

   _modalOpen = true;
}

export function stopEdit() {
   _editingVM = null;
   _isEditingVMCommands = false;
   _modalOpen = false;
}

// Command edit state change
export function startEditCommand(command) {
   _editingCommand = command;
}

export function stopEditCommand() {
   _editingCommand = null;
}

/* ── internal APIs for store integration ── */
export function _setSelectedVM(vm) {
   _selectedVM = vm;
}

export function _setSelectedVMJobs(jobs) {
   _selectedVMJobs = jobs;
}

/* ── store injection (called once) ── */
let _vmStore, _commandStore, _jobStore, _logStore;
let _storesAttached = false;

export function attachStores({
   vmStoreRef,
   commandStoreRef,
   jobStoreRef,
   logStoreRef,
}) {
   if (_storesAttached) return;

   _vmStore = vmStoreRef;
   _commandStore = commandStoreRef;
   _jobStore = jobStoreRef;
   _logStore = logStoreRef;

   _storesAttached = true;
}

/* ── derive the rest whenever id changes ── */
let lastId = null;
$effect.root(() => {
   $effect(() => {
      if (!_vmStore || !_commandStore || !_jobStore || !_selectedVMId) return;

      if (_selectedVMId !== lastId) {
         lastId = _selectedVMId;

         /* 1. synchronous data that might be cached */
         _selectedVM = _vmStore.getVMById(_selectedVMId);

         _selectedVMCommands = _commandStore.getCommandsForVM(_selectedVMId);
         _selectedVMJobs = _jobStore.getVMJobs?.(_selectedVMId) ?? [];
         _logLines = _jobStore.getLogLines?.(_selectedVMId) ?? [];

         /* 2. async refreshes (fire-and-forget, update when done) */
         _commandStore.loadVMCommands(_selectedVMId).then(() => {
            _selectedVMCommands = _commandStore.getCommandsForVM(_selectedVMId);
         });

         _jobStore.loadVMJobs?.(_selectedVMId).then(() => {
            _selectedVMJobs = _jobStore.getVMJobs(_selectedVMId);
         });
      }
   });
});

/* helper that can be reused inside this module */
function refreshSelectedVM(vmPrm) {
   if (!_vmStore || !_commandStore || !_jobStore) return;

   // Immediate sync data
   const vm = _vmStore.resolveVM(vmPrm);
   _setSelectedVM(vm);
   _setSelectedVMCommands = _commandStore.getCommandsForVM(vm.id);
   _selectedVMJobs = _jobStore.getVMJobs?.(vm.id) ?? [];
}

// --------------------- helper ------------------------
// recent VMs
export function getRecentVMs(vms) {
   const ids = _getRecentVMIds();
   if (!Array.isArray(vms)) return ids;
   return _sortVMsByRecent(vms, ids);
}

function addRecentVM(vmId) {
   const ids = _getRecentVMIds();
   const idx = ids.indexOf(vmId);
   if (idx !== -1) ids.splice(idx, 1);
   ids.unshift(vmId);
   localStorage.setItem("recentVMs", JSON.stringify(ids));
}

function _getRecentVMIds() {
   const json = localStorage.getItem("recentVMs");
   return json ? JSON.parse(json) : [];
}

function _sortVMsByRecent(vms, recentIds) {
   const recentSet = new Set(recentIds);
   const recentVMs = vms.filter((vm) => recentSet.has(vm.id));
   const otherVMs = vms.filter((vm) => !recentSet.has(vm.id));

   // Sort recent VMs by their position in recentIds array
   const sortedRecent = recentVMs.sort((a, b) => {
      return recentIds.indexOf(a.id) - recentIds.indexOf(b.id);
   });

   const result = [...sortedRecent, ...otherVMs];
   return result;
}

export async function initializedUIState() {
   return new Promise((resolve) => {
      console.log("[initializedUI] vmid", _selectedVMId);
      refreshSelectedVM(_selectedVMId);
      resolve();
   });
}
