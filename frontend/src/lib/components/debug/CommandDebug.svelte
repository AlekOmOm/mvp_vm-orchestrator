<script>
  import { onMount } from 'svelte';
  import { storesContainer } from '../../stores/StoresContainer.js';
  import { getService } from '../../core/ServiceContainer.js';

  let vmStore;
  let selectedVM = $state(null);

  onMount(async () => {
    vmStore = await storesContainer.get('vmStore');

    $effect(() => {
      if (vmStore) {
        const state = vmStore.getValue();
        selectedVM = state.selectedVM;
      }
    });
  });

  // Debug info derived from selected VM
  let debugInfo = $derived({
    selectedVM: selectedVM,
    hasVM: !!selectedVM,
    vmId: selectedVM?.id,
    vmName: selectedVM?.name
  });

  async function testDirectAPI() {
    if (!selectedVM) return;

    try {
      const vmService = getService('vmService');
      const result = await vmService.testConnection(selectedVM.id);
      console.log('Direct API test result:', result);
    } catch (error) {
      console.error('Direct API test failed:', error);
    }
  }
</script>

<div class="p-4 bg-gray-100 border rounded">
  <h4 class="font-bold mb-2">Command Debug Info</h4>
  <pre class="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
  
  {#if selectedVM}
    <button onclick={testDirectAPI} class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm">
      Test Direct API Call
    </button>
  {/if}
</div>
