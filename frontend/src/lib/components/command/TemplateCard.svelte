<script>
  import { createEventDispatcher } from 'svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';

  let { template } = $props();
  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch('select');
  }

  const typeConfig = {
    ssh: { variant: 'default', label: 'SSH' },
    stream: { variant: 'secondary', label: 'Local' },
    terminal: { variant: 'outline', label: 'Terminal' }
  };
</script>

<Card class="cursor-pointer hover:shadow-md transition-shadow" onclick={handleClick}>
  <CardHeader class="pb-2">
    <div class="flex items-center justify-between">
      <CardTitle class="text-base">{template.name}</CardTitle>
      <Badge variant={typeConfig[template.type]?.variant || 'outline'}>
        {typeConfig[template.type]?.label || template.type}
      </Badge>
    </div>
  </CardHeader>
  <CardContent class="pt-0">
    {#if template.description}
      <p class="text-sm text-gray-600 mb-2">{template.description}</p>
    {/if}
    <code class="text-xs bg-gray-100 px-2 py-1 rounded block truncate">
      {template.cmd}
    </code>
  </CardContent>
</Card> 