<!--
  Job Component
  
  Displays a single job with its status, command, and execution details.
  Shows different states and provides action buttons for job management.
-->

<script>

  import { Button } from '$lib/components/lib/ui/button';
  import { Card, CardContent } from '$lib/components/lib/ui/card';
  import { Badge } from '$lib/components/lib/ui/badge';
  import StatusBadge from '$lib/components/lib/ui/StatusBadge.svelte';
  import {
    Eye,
    RotateCcw
  } from 'lucide-svelte';

  let { job, showActions = true, compact = false, onviewlogs = () => {}, onretry = () => {} } = $props();
  $effect(() => {
    console.log('[Job] render', job.id, job.status);
  });

  function handleViewLogs() {
    onviewlogs(job);
  }

  function handleRetry() {
    onretry(job);
  }

  // Enhanced status mapping with more status types
  let badgeStatus = $derived({
      'running': 'loading',
      'success': 'success',
      'completed': 'success',
      'failed': 'error',
      'error': 'error',
      'canceled': 'warning',
      'cancelled': 'warning',
      'spawned': 'info',
      'pending': 'info',
      'queued': 'info'
    }[job.status] || 'default');

  // Enhanced time formatting
  let startTime = $derived(() => {
    if (!job.started_at) return 'Not started';
    const date = new Date(job.started_at);
    return date.toLocaleString();
  });

  let endTime = $derived(() => {
    if (!job.finished_at) return null;
    const date = new Date(job.finished_at);
    return date.toLocaleString();
  });

  let duration = $derived(() => {
    if (!job.started_at) return null;
    const start = new Date(job.started_at);
    const end = job.finished_at ? new Date(job.finished_at) : new Date();
    const seconds = Math.round((end - start) / 1000);

    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  });

  let displayCommand = $derived(() => {
    if (!job.command) return 'No command';
    const maxLength = compact ? 40 : 60;
    return job.command.length > maxLength
      ? job.command.substring(0, maxLength) + '...'
      : job.command;
  });

  let canRetry = $derived(['failed', 'error', 'canceled', 'cancelled'].includes(job.status));


</script>

{#if compact}
  <!-- Compact view for lists -->
  <div class="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <StatusBadge status={badgeStatus} size="sm">
          {job.status}
        </StatusBadge>
        <span class="text-xs text-muted-foreground">{startTime}</span>
      </div>
      <p class="text-sm font-mono truncate">{displayCommand}</p>
    </div>

    {#if showActions}
      <div class="flex gap-1">
        <Button variant="outline" size="sm" onclick={handleViewLogs}>
          <Eye class="w-3 h-3" />
        </Button>
        {#if canRetry}
          <Button variant="outline" size="sm" onclick={handleRetry}>
            <RotateCcw class="w-3 h-3" />
          </Button>
        {/if}
      </div>
    {/if}
  </div>
{:else}
  <!-- Full card view -->
  <Card class="transition-all duration-200">
    <CardContent class="pt-4 space-y-3">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2">
          <StatusBadge status={badgeStatus}>
            {job.status}
          </StatusBadge>
          {#if job.type}
            <Badge variant="outline" class="text-xs">
              {job.type}
            </Badge>
          {/if}
        </div>
        
        {#if job.exit_code !== null && job.exit_code !== undefined}
          <Badge variant={job.exit_code === 0 ? 'default' : 'destructive'} class="text-xs">
            Exit: {job.exit_code}
          </Badge>
        {/if}
      </div>

      <!-- Command -->
      <div class="space-y-1">
        <p class="text-sm font-medium">Command:</p>
        <pre class="text-xs font-mono bg-muted p-2 rounded whitespace-pre-wrap break-all">{job.command}</pre>
      </div>

      <!-- Timing Information -->
      <div class="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
        <div>
          <span class="font-medium">Started:</span>
          <br>{startTime}
        </div>
        {#if endTime}
          <div>
            <span class="font-medium">Finished:</span>
            <br>{endTime}
          </div>
        {/if}
      </div>

      {#if duration !== null}
        <div class="text-xs text-muted-foreground">
          <span class="font-medium">Duration:</span> {duration}s
        </div>
      {/if}

      <!-- Actions -->
      {#if showActions}
        <div class="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onclick={handleViewLogs} class="flex-1">
            <Eye class="w-3 h-3 mr-1" />
            View Logs
          </Button>
          {#if canRetry}
            <Button variant="outline" size="sm" onclick={handleRetry}>
              <RotateCcw class="w-3 h-3 mr-1" />
              Retry
            </Button>
          {/if}
        </div>
      {/if}
    </CardContent>
  </Card>
{/if}
