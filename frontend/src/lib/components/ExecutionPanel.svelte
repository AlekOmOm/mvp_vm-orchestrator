<script>
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/lib/ui/tabs/index.js';
  import Panel from '$lib/components/lib/ui/Panel.svelte';
  import ExecutionTab from '$lib/components/subpanels/execution/ExecutionTab.svelte';
  import JobHistory from '$lib/components/subpanels/execution/HistoryTab.svelte';
  import Terminal from '$lib/components/subpanels/execution/subExecutionTab/Terminal.svelte';

  let {
    currentJob = null,
    currentAlert = null
  } = $props();

  let activeTab = $state('execute');
</script>

<Panel variant="main" class="h-full flex flex-col">
  <Tabs bind:value={activeTab} class="flex-1 flex flex-col h-full">
    <TabsList class="grid w-full grid-cols-2 flex-none">
      <TabsTrigger value="execute">Execute</TabsTrigger>
      <TabsTrigger value="history">History</TabsTrigger>
    </TabsList>
    
    <TabsContent value="execute" class="flex-1 flex flex-col h-full mt-0">
      <ExecutionTab onalert={(alert) => currentAlert = alert} />
    </TabsContent>
    
    <TabsContent value="history" class="flex-1 h-full mt-0">
      <JobHistory />
    </TabsContent>
  </Tabs>

  {#if currentJob}
    <div class="border-t bg-muted px-6 py-3 text-sm flex-none">
      Running: <code class="bg-muted-foreground/10 px-1 rounded">{currentJob.command}</code>
    </div>
  {/if}
</Panel>
