<!--
  Job History Component
  
  Displays a list of jobs with filtering and pagination.
  Shows both database jobs and cached VM jobs.
-->

<script>
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import Job from './Job.svelte';
  import JobLogModal from './JobLogModal.svelte';
  import { jobStore, currentVMJobs, jobLoading, jobs } from '../../stores/jobStore.js';
  import { selectedVM } from '../../stores/vmStore.js';
  import { History, RefreshCw } from 'lucide-svelte';

  let {
    showVMJobs = true,
    showAllJobs = true,
    limit = 20,
    onviewlogs = () => {},
    onretry = () => {},
  } = $props();

  let statusFilter = $state('all');
  let showLogModal = $state(false);
  let selectedJob = $state(null);

  onMount(() => {
    if (showAllJobs) jobStore.loadJobs();
  });

  $effect(() => {
    if ($selectedVM && showVMJobs) {
      jobStore.loadVMJobs($selectedVM.id, { limit });
    }
  });

  function handleRefresh() {
    if ($selectedVM) {
      jobStore.loadVMJobs($selectedVM.id, { limit });
    } else if (showAllJobs) {
      jobStore.loadJobs();
    }
  }

  function handleViewLogs(job) {
    selectedJob = job;
    showLogModal = true;
    onviewlogs(job);
  }

  function handleLogModalClose() {
    showLogModal = false;
    selectedJob = null;
  }

  let filteredJobs = $derived.by(() => {
    const allJobs = $jobs || [];
    const vmJobs = $selectedVM ? ($currentVMJobs || []) : allJobs;
    const list = statusFilter === 'all'
      ? vmJobs.slice(0, limit)
      : vmJobs.filter(j => j.status === statusFilter).slice(0, limit);
    return list;
  });

  let loading = $derived($jobLoading);
</script>

<Card>
  <CardHeader>
    <div class="flex items-center justify-between">
      <CardTitle class="flex items-center gap-2">
        <History class="w-5 h-5" />
        Job History
        {#if filteredJobs.length > 0}
          <Badge variant="outline">{filteredJobs.length}</Badge>
        {/if}
      </CardTitle>
      <Button variant="outline" size="sm" onclick={handleRefresh} disabled={loading}>
        <RefreshCw class="w-4 h-4 mr-1 {loading ? 'animate-spin' : ''}" />
        Refresh
      </Button>
    </div>
  </CardHeader>

  <CardContent class="space-y-4 overflow-y-auto max-h-[75vh]">
    <select bind:value={statusFilter} class="text-sm border rounded px-2 py-1">
      <option value="all">All Status</option>
      <option value="running">Running</option>
      <option value="success">Success</option>
      <option value="failed">Failed</option>
    </select>

    {#if loading && filteredJobs.length === 0}
      <div class="text-center py-4">Loading...</div>
    {:else if filteredJobs.length === 0}
      <div class="text-center py-8 text-muted-foreground">No jobs found</div>
    {:else}
      <div class="space-y-2">
        {#each filteredJobs as job (job.id)}
          <Job {job} onviewlogs={handleViewLogs} onretry />
        {/each}
      </div>
    {/if}
  </CardContent>
</Card>

<JobLogModal job={selectedJob} isOpen={showLogModal} onClose={handleLogModalClose} />
