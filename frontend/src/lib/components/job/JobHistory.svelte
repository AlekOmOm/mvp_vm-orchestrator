<!--
  Job History Component
  
  Displays a list of jobs with filtering and pagination.
  Shows both database jobs and cached VM jobs.
-->

<script>
  import { onMount } from 'svelte';
  import { derived } from 'svelte/store';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import JobFilters from './jobSubs/JobFilters.svelte';
  import JobStats from './jobSubs/JobStats.svelte';
  import JobList from './jobSubs/JobList.svelte';
  import JobListSkeleton from './jobSubs/JobListSkeleton.svelte';
  import { jobStore, jobs, currentVMJobs, jobLoading, jobStats } from '../../stores/jobStore.js';
  import { selectedVM } from '../../stores/vmStore.js';
  import {
    History,
    RefreshCw,
    Clock
  } from 'lucide-svelte';

  let {
    showVMJobs = true,
    showAllJobs = true,
    compact = false,
    limit = 20,
    onviewlogs = () => {},
    onretry = () => {},
  } = $props();

  // Filter state
  let statusFilter = $state('all');
  let viewMode = $state('recent'); // 'recent', 'vm', 'all'

  // Load jobs on mount
  onMount(() => {
    if (showAllJobs) {
      jobStore.loadJobs();
    }
  });

  // Load VM jobs when selected VM changes
  let loadVMJobs = () => {
    jobStore.loadVMJobs($selectedVM.id, { limit });
  };

  if ($selectedVM && showVMJobs) {
    loadVMJobs();
  }

  function handleRefresh() {
    if (viewMode === 'vm' && $selectedVM) {
      loadVMJobs();
    } else if (showAllJobs) {
      jobStore.loadJobs();
    }
  }

  function handleViewLogs(job) {
    onviewlogs(job);
  }

  function handleRetryJob(job) {
    onretry(job);
  }

  // Filter jobs based on current settings (value signal)
  let filteredJobs = $derived.by(() => {
    let jobList = [];
    const vmJobs = $currentVMJobs || [];
    const allJobs = $jobs || [];

    if (viewMode === 'vm' && $selectedVM) {
      jobList = vmJobs;
    } else if (viewMode === 'all') {
      jobList = allJobs;
    } else {
      const combined = [...vmJobs, ...allJobs];
      const uniqueJobs = Array.from(new Map(combined.map(job => [job.id, job])).values());
      jobList = uniqueJobs
        .sort((a, b) => new Date(b.started_at || b.createdAt) - new Date(a.started_at || a.createdAt));
    }

    let filtered = statusFilter === 'all'
      ? jobList
      : jobList.filter(job => job.status === statusFilter);

    const final = filtered.slice(0, limit);

    return final;
  });

  $effect(() => { if (viewMode === 'vm' && $selectedVM) jobStore.loadVMJobs($selectedVM.id, { limit }); });

  // Status filter options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'running', label: 'Running' },
    { value: 'success', label: 'Success' },
    { value: 'failed', label: 'Failed' },
    { value: 'spawned', label: 'Spawned' }
  ];

  // View mode options
  const viewModeOptions = [
    { value: 'recent', label: 'Recent Jobs' },
    { value: 'vm', label: 'Current VM', disabled: !$selectedVM },
    { value: 'all', label: 'All Jobs' }
  ];

  let stats = $derived.by(() => $jobStats);
  let loading = $derived.by(() => $jobLoading);
</script>

<Card>
  <CardHeader>
    <div class="flex items-center justify-between">
      <CardTitle class="flex items-center gap-2">
        <History class="w-5 h-5" />
        Job History
        {#if filteredJobs.length > 0}
          <Badge variant="outline" class="text-xs">
            {filteredJobs.length}
          </Badge>
        {/if}
      </CardTitle>
      
      <Button variant="outline" size="sm" onclick={handleRefresh} disabled={loading}>
        <RefreshCw class="w-4 h-4 mr-1 {loading ? 'animate-spin' : ''}" />
        Refresh
      </Button>
    </div>
  </CardHeader>

  <CardContent class="space-y-4 overflow-y-auto max-h-[75vh]">
    <JobFilters bind:viewMode bind:statusFilter viewOptions={viewModeOptions} statusOptions={statusOptions} />

    <JobStats {stats} show={viewMode === 'all'} />

    {#if loading && filteredJobs.length === 0}
      <JobListSkeleton />
    {:else if filteredJobs.length === 0}
      <div class="text-center py-8">
        <Clock class="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p class="text-muted-foreground">
          {statusFilter === 'all' ? 'No jobs found' : `No ${statusFilter} jobs found`}
        </p>
        {#if viewMode === 'vm' && !$selectedVM}
          <p class="text-xs text-muted-foreground mt-1">
            Select a VM to view its job history
          </p>
        {/if}
      </div>
    {:else}
      <JobList jobs={filteredJobs} {compact} limit={limit} onviewlogs={handleViewLogs} onretry={handleRetryJob} />
    {/if}
  </CardContent>
</Card>
