<script>
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import Panel from '$lib/components/ui/Panel.svelte';
  import CommandExecutionView from '$lib/components/execution/commands/CommandExecutionView.svelte';
  import JobHistory from '$lib/components/job/JobHistory.svelte';
  import Terminal from '$lib/components/Terminal.svelte';

  let {
    currentJob = null,
    currentAlert = null
  } = $props();

  let activeTab = $state('execute');
</script>

<Panel variant="main" class="h-full flex flex-col">
  <Tabs bind:value={activeTab} class="flex-1 flex flex-col">
    <TabsList class="grid w-full grid-cols-2">
      <TabsTrigger value="execute">Execute</TabsTrigger>
      <TabsTrigger value="history">History</TabsTrigger>
    </TabsList>
    
    <TabsContent value="execute" class="flex-1 flex flex-col mt-0">
      <div class="flex-1 overflow-y-auto">
        <CommandExecutionView onalert={(alert) => currentAlert = alert} />
      </div>
      <div class="flex-none border-t">
        <Terminal class="min-h-[120px]" />
      </div>
    </TabsContent>
    
    <TabsContent value="history" class="flex-1 mt-0">
      <JobHistory />
    </TabsContent>
  </Tabs>

  {#if currentJob}
    <div class="border-t bg-muted px-6 py-3 text-sm">
      Running: <code class="bg-muted-foreground/10 px-1 rounded">{currentJob.command}</code>
    </div>
  {/if}
</Panel>
