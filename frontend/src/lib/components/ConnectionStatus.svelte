<script>
  import { derived } from 'svelte/store';
  import { Badge } from '$lib/components/ui/badge';
  
  let { status } = $props();

  // $derived or $effect

  let variant = $derived({
    'connecting': 'secondary',
    'connected': 'default',
    'disconnected': 'destructive'
  }[status] || 'outline');


  let statusText = $derived({
    'connecting': 'Connecting...',
    'connected': 'Connected',
    'disconnected': 'Disconnected'
  }[status] || 'Unknown');

  let statusIcon = $derived({
    'connecting': '🔄',
    'connected': '✅',
    'disconnected': '❌'
  }[status] || '❓');
</script>

<Badge {variant} class="flex items-center gap-2">
  <span class="text-sm">{statusIcon}</span>
  <span>{statusText}</span>
</Badge> 