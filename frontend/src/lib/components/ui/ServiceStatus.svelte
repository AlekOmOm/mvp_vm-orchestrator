<script>
  import { serviceHealth } from '$lib/core/ServiceContainer.js';
  import { Badge } from '$lib/components/ui/badge';
  import { CheckCircle, AlertCircle, Loader2 } from 'lucide-svelte';

  let health = $derived($serviceHealth);
  
  function getStatusIcon(status) {
    switch (status) {
      case 'connected': return CheckCircle;
      case 'connecting': return Loader2;
      default: return AlertCircle;
    }
  }
</script>

<div class="flex gap-2">
  {#each Object.entries(health) as [service, status]}
    <Badge variant={status === 'connected' ? 'default' : 'secondary'}>
      <svelte:component this={getStatusIcon(status)} class="w-3 h-3 mr-1" />
      {service}
    </Badge>
  {/each}
</div>