<!--
  Job Component
  
  Displays a single job with its status, command, and execution details.
  Shows different states and provides action buttons for job management.
-->

<script>

  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import {
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Terminal,
    Eye,
    RotateCcw
  } from 'lucide-svelte';

  let { job, showActions = true, compact = false, onviewlogs = () => {}, onretry = () => {} } = $props();

  function handleViewLogs() {
    onviewlogs(job);
  }

  function handleRetry() {
    onretry(job);
  }

  // Map job status to StatusBadge status
  let badgeStatus = $derived({
      'running': 'loading',
      'success': 'success',
      'failed': 'error',
      'canceled': 'warning',
      'spawned': 'info'
    }[job.status] || 'default');
  
  let startTime = $derived(job.started_at ? new Date(job.started_at).toLocaleString() : 'Unknown');
  let endTime = $derived(job.finished_at ? new Date(job.finished_at).toLocaleString() : null);
  let duration = $derived(job.started_at && job.finished_at ? Math.round((new Date(job.finished_at) - new Date(job.started_at)) / 1000) : null);

  let displayCommand = $derived(job.command && job.command.length > 60 ? job.command.substring(0, 60) + '...' : job.command);

  let canRetry = $derived(['failed', 'canceled'].includes(job.status));
  let isActive = $derived(job.status === 'running');
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
