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
  import { Select } from '$lib/components/ui/select';
  import Job from './Job.svelte';
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

  // Filter jobs based on current settings
  let filteredJobs = $derived(() => {
    let jobList = [];

    if (viewMode === 'vm' && $selectedVM) {
      jobList = $currentVMJobs;
    } else if (viewMode === 'all') {
      jobList = $jobs;
    } else {
      // Recent: combine both sources
      jobList = [...($currentVMJobs || []), ...($jobs || [])]
        .sort((a, b) => new Date(b.started_at || b.createdAt) - new Date(a.started_at || a.createdAt))
        .slice(0, limit);
    }

    if (statusFilter !== 'all') {
      jobList = jobList.filter(job => job.status === statusFilter);
    }

    return jobList.slice(0, limit);
  });

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

  let stats = $derived(() => $jobStats);
  let loading = $derived(() => $jobLoading);
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

  <CardContent class="space-y-4">
    <!-- Filters -->
    <div class="flex gap-2 flex-wrap">
      <div class="flex items-center gap-2">
        <Select bind:value={viewMode} class="w-32">
          {#each viewModeOptions as option}
            <option value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          {/each}
        </Select>
      </div>

      <Select bind:value={statusFilter} class="w-32">
        {#each statusOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </Select>
    </div>

    <!-- Stats Summary -->
    {#if stats && viewMode === 'all'}
      <div class="grid grid-cols-4 gap-2 p-3 bg-muted/50 rounded-lg">
        <div class="text-center">
          <div class="text-lg font-semibold">{stats.total}</div>
          <div class="text-xs text-muted-foreground">Total</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-semibold text-blue-600">{stats.running}</div>
          <div class="text-xs text-muted-foreground">Running</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-semibold text-green-600">{stats.success}</div>
          <div class="text-xs text-muted-foreground">Success</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-semibold text-red-600">{stats.failed}</div>
          <div class="text-xs text-muted-foreground">Failed</div>
        </div>
      </div>
    {/if}

    <!-- Job List -->
    {#if loading && filteredJobs.length === 0}
      <div class="space-y-2">
        {#each Array(3) as _}
          <div class="animate-pulse">
            <div class="h-16 bg-muted rounded-lg"></div>
          </div>
        {/each}
      </div>
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
      <div class="space-y-2">
        {#each filteredJobs as job (job.id)}
          <Job
            {job}
            {compact}
            onviewlogs={handleViewLogs}
            onretry={handleRetryJob}
          />
        {/each}
      </div>

      {#if filteredJobs.length >= limit}
        <div class="text-center pt-2">
          <p class="text-xs text-muted-foreground">
            Showing latest {limit} jobs
          </p>
        </div>
      {/if}
    {/if}
  </CardContent>
</Card>
