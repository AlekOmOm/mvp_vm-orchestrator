/* src/lib/state/ui.state.svelte.js
 *
 * UI state singleton with private $state and public accessors
 */

/* ── private reactive fields ── */
// vm selected
let _selectedVMId = $state(localStorage.getItem("lastSelectedVMId"));
let _selectedVM = $state(null);
let _selectedVMCommands = $state([]);
let _selectedVMJobs = $state([]);

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
   console.log("🔍 getSelectedVMId called:", _selectedVMId);
   return _selectedVMId;
}
export function getSelectedVM() {
   console.log("🔍 getSelectedVM called:", _selectedVM?.name || "undefined");
   if (_selectedVMId === undefined) {
      return null;
   }
   return _selectedVM;
}
export function getSelectedVMCommands() {
   return _selectedVMCommands;
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

// Add command-specific state getters
export function getSelectedCommand() {
   return _selectedCommand;
}

export function getEditingCommand() {
   return _editingCommand;
}

/* ── public actions that mutate state ── */
export function selectVM(id) {
   console.log("selectVM:", id);
   _selectedVMId = id;
   if (id) localStorage.setItem("lastSelectedVMId", id);
   else localStorage.removeItem("lastSelectedVMId");

   // Immediate refresh
   refreshSelectedVM(id);
}

// Command selection actions
export function selectCommand(commandId) {
   _selectedCommand = commandId;
}

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

export function _setSelectedVMCommands(commands) {
   _selectedVMCommands = commands;
}

export function _setSelectedVMJobs(jobs) {
   _selectedVMJobs = jobs;
}

/* ── store injection (called once) ── */
let vmStore, commandStore, jobStore;
let storesAttached = false;

export function attachStores({ vmStoreRef, commandStoreRef, jobStoreRef }) {
   if (storesAttached) {
      console.log("⚠️ attachStores already called, skipping");
      return;
   }

   console.log("🔗 attachStores called");
   vmStore = vmStoreRef;
   commandStore = commandStoreRef;
   jobStore = jobStoreRef;
   storesAttached = true;

   /* if a VM was already chosen before the stores existed, refresh it */
   if (_selectedVMId) {
      console.log("🔄 Refreshing pre-selected VM:", _selectedVMId);
      refreshSelectedVM(_selectedVMId);
   }
}

/* ── derive the rest whenever id changes ── */
let lastId = null;
$effect.root(() => {
   $effect(() => {
      console.log("🔍 UI State effect triggered - vmStore exists:", !!vmStore);
      console.log(
         "🔍 UI State effect triggered - _selectedVMId:",
         _selectedVMId
      );

      if (!vmStore || !commandStore || !jobStore || !_selectedVMId) return;

      if (_selectedVMId !== lastId) {
         lastId = _selectedVMId;
         console.log("🔄 Selected VM ID changed to:", _selectedVMId);

         /* 1. synchronous data that might be cached */
         _selectedVM = vmStore.getVMById(_selectedVMId);
         console.log("✅ Selected VM updated:", _selectedVM?.name);

         _selectedVMCommands = commandStore.getCommandsForVM(_selectedVMId);
         _selectedVMJobs = jobStore.getVMJobs?.(_selectedVMId) ?? [];

         /* 2. async refreshes (fire-and-forget, update when done) */
         commandStore.loadVMCommands(_selectedVMId).then(() => {
            _selectedVMCommands = commandStore.getCommandsForVM(_selectedVMId);
         });

         jobStore.loadVMJobs?.(_selectedVMId).then(() => {
            _selectedVMJobs = jobStore.getVMJobs(_selectedVMId);
         });
      }
   });
});

/* helper that can be reused inside this module */
function refreshSelectedVM(id) {
   if (!vmStore || !commandStore || !jobStore) return;

   console.log("🔄 Refreshing selected VM:", id);

   // Immediate sync data
   _selectedVM = vmStore.getVMById(id);
   _selectedVMCommands = commandStore.getCommandsForVM(id);
   _selectedVMJobs = jobStore.getVMJobs?.(id) ?? [];

   // Async refresh
   if (id) {
      commandStore.loadVMCommands(id).then(() => {
         _selectedVMCommands = commandStore.getCommandsForVM(id);
         console.log(
            "✅ Commands loaded for VM:",
            id,
            _selectedVMCommands.length
         );
      });
   }
}
