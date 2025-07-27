<!--
  VM Component
  
  Displays a single VM with its details and action buttons.
  Supports editing, deletion, and selection operations.
-->

<script>

  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { 
    Server, 
    Edit, 
    Trash2, 
    Play, 
    Settings,
    CheckCircle2
  } from 'lucide-svelte';

  // Props using Svelte 5 runes
  let {
    vm,
    isSelected = false,
    isExecuting = false,
    commandCount = 0,
    onselect,
    onedit,
    ondelete,
    onmanagecommands
  } = $props();

  function handleSelect() {
    onselect?.(vm);
  }

  function handleEdit() {
    onedit?.(vm);
  }

  function handleDelete() {
    ondelete?.(vm);
  }

  function handleManageCommands() {
    onmanagecommands?.(vm);
  }

  // Get environment badge variant using $derived
  const environmentVariant = $derived({
    'development': 'secondary',
    'staging': 'outline',
    'production': 'destructive'
  }[vm.environment] || 'outline');

  // Short label for environment
  const environmentLabel = $derived({
    'development': 'dev',
    'staging': 'stage',
    'production': 'prod'
  }[vm.environment] || vm.environment);

  // Format creation date using $derived
  const createdDate = $derived(new Date(vm.createdAt).toLocaleDateString());
</script>

<div
  class="cursor-pointer"
  role="button"
  tabindex="0"
  onclick={handleSelect}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect();
    }
  }}
>
  <Card class="transition-all duration-200 {isSelected ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md'}">
  <CardHeader class="pb-2">
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-2">
        <div class="p-1 bg-primary/10 rounded-lg">
          <Server class="w-4 h-4 text-primary" />
        </div>
        <div>
          <CardTitle class="text-base flex items-center gap-2">
            {vm.name}
            {#if isSelected}
              <CheckCircle2 class="w-4 h-4 text-green-600" />
            {/if}
          </CardTitle>
          <p class="text-xs text-muted-foreground mt-1 break-all">
            {vm.user}@{vm.host}
          </p>
        </div>
      </div>
      <Badge variant={environmentVariant} class="text-xs">
        {environmentLabel}
      </Badge>
    </div>
  </CardHeader>

  <CardContent class="space-y-3">
    <!-- VM Details -->
    <div class="space-y-1 text-xs">
      {#if vm.description}
        <p class="text-muted-foreground">{vm.description}</p>
      {/if}
      
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground text-xs">Commands:</span>
        <Badge variant="outline" class="text-xs">
          {commandCount}
        </Badge>
      </div>
      
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground text-xs">Created:</span>
        <span class="text-xs">{createdDate}</span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-start gap-1 pt-1 border-t">
      <Button
        variant={isSelected ? "default" : "outline"}
        size="sm"
        onclick={handleSelect}
        disabled={isExecuting}
        class="h-8 w-8 p-0"
      >
        <Play class="w-3 h-3" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onclick={handleManageCommands}
        disabled={isExecuting}
        class="h-8 w-8 p-0"
      >
        <Settings class="w-3 h-3" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onclick={handleEdit}
        disabled={isExecuting}
        class="h-8 w-8 p-0"
      >
        <Edit class="w-3 h-3" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onclick={handleDelete}
        disabled={isExecuting}
        class="h-8 w-8 p-0 text-destructive hover:text-destructive"
      >
        <Trash2 class="w-3 h-3" />
      </Button>
    </div>
  </CardContent>
  </Card>
</div>
