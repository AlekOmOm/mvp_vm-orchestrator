<script>
  import { selectedVM } from '../../stores/vmStore.js';
  import { commandStore, currentVMCommands } from '../../stores/commandStore.js';
  import { getService } from '../../core/ServiceContainer.js';

  const commandService = getService('commandService');

  let debugInfo = $state({
    selectedVM: null,
    commands: [],
    loading: false,
    error: null
  });

  $effect(() => {
    debugInfo.selectedVM = $selectedVM;
    debugInfo.commands = $currentVMCommands;
  });

  async function testDirectAPI() {
    if (!$selectedVM) return;
    
    try {
      debugInfo.loading = true;
      const commands = await commandService.listVMCommands($selectedVM.id);
      console.log('Direct API call result:', commands);
      debugInfo.error = null;
    } catch (error) {
      console.error('Direct API call failed:', error);
      debugInfo.error = error.message;
    } finally {
      debugInfo.loading = false;
    }
  }
</script>

<div class="p-4 bg-gray-100 border rounded">
  <h4 class="font-bold mb-2">Command Debug Info</h4>
  <pre class="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
  
  {#if $selectedVM}
    <button onclick={testDirectAPI} class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm">
      Test Direct API Call
    </button>
  {/if}
</div>