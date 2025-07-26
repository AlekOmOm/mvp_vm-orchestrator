<script>
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { RefreshCw, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-svelte';

  let jobs = $props();

  const dispatch = createEventDispatcher();

  function refreshHistory() {
    dispatch('refresh');
  }

  function formatDuration(started, finished) {
    if (!finished) return 'Running...';
    const duration = new Date(finished) - new Date(started);
    return `${(duration / 1000).toFixed(1)}s`;
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'running': return Clock;
      case 'success': return CheckCircle2;
      case 'failed': return XCircle;
      default: return AlertCircle;
    }
  }

  function getStatusVariant(status) {
    switch (status) {
      case 'running': return 'secondary';
      case 'success': return 'default';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  }

  $: hasJobs = jobs.length > 0;
</script>

<div class="h-full flex flex-col">
  <div class="p-4 border-b">
    <div class="flex items-center justify-between">
      <Button
        variant="ghost"
        size="sm"
        onclick={refreshHistory}
        class="gap-2"
      >
        <RefreshCw class="w-4 h-4" />
        Refresh
      </Button>
    </div>
  </div>

  <div class="flex-1 overflow-hidden">
    {#if !hasJobs}
      <div class="flex items-center justify-center h-full text-muted-foreground">
        <div class="text-center">
          <Clock class="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No job history yet</p>
          <p class="text-xs">Execute commands to see history</p>
        </div>
      </div>
    {:else}
      <div class="h-full overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Command</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Started</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each jobs as job}
              <TableRow>
                <TableCell class="font-mono text-sm">
                  <span class="font-semibold">{job.command}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(job.status)} class="gap-1">
                    <svelte:component this={getStatusIcon(job.status)} class="w-3 h-3" />
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" class="text-xs">
                    {job.type}
                  </Badge>
                </TableCell>
                <TableCell class="text-sm text-muted-foreground">
                  {formatDuration(job.started_at, job.finished_at)}
                </TableCell>
                <TableCell class="text-sm text-muted-foreground">
                  {formatTime(job.started_at)}
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </div>
    {/if}
  </div>
</div> 