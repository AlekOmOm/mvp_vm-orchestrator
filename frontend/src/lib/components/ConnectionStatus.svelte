<script>
  import { Badge } from '$lib/components/ui/badge';
  
  export let status;

  $: variant = {
    'connecting': 'secondary',
    'connected': 'default',
    'disconnected': 'destructive'
  }[status] || 'outline';

  $: statusText = {
    'connecting': 'Connecting...',
    'connected': 'Connected',
    'disconnected': 'Disconnected'
  }[status] || 'Unknown';

  $: statusIcon = {
    'connecting': '🔄',
    'connected': '✅',
    'disconnected': '❌'
  }[status] || '❓';
</script>

<Badge {variant} class="flex items-center gap-2">
  <span class="text-sm">{statusIcon}</span>
  <span>{statusText}</span>
</Badge> 