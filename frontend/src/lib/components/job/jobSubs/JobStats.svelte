<script>
let { stats, show = false } = $props();
</script>
{#if show}
  <div class="grid grid-cols-4 gap-2 p-3 bg-muted/50 rounded-lg">
    <div class="text-center"><div class="text-lg font-semibold">{stats.total}</div><div class="text-xs text-muted-foreground">Total</div></div>
    <div class="text-center"><div class="text-lg font-semibold text-blue-600">{stats.running}</div><div class="text-xs text-muted-foreground">Running</div></div>
    <div class="text-center"><div class="text-lg font-semibold text-green-600">{stats.success}</div><div class="text-xs text-muted-foreground">Success</div></div>
    <div class="text-center"><div class="text-lg font-semibold text-red-600">{stats.failed}</div><div class="text-xs text-muted-foreground">Failed</div></div>
  </div>
{/if} 