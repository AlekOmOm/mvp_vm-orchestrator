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

  // Format creation date using $derived
  const createdDate = $derived(new Date(vm.createdAt).toLocaleDateString());
</script>

<Card class="transition-all duration-200 {isSelected ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md'}">
  <CardHeader class="pb-3">
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Server class="w-5 h-5 text-primary" />
        </div>
        <div>
          <CardTitle class="text-lg flex items-center gap-2">
            {vm.name}
            {#if isSelected}
              <CheckCircle2 class="w-4 h-4 text-green-600" />
            {/if}
          </CardTitle>
          <p class="text-sm text-muted-foreground mt-1">
            {vm.user}@{vm.host}
          </p>
        </div>
      </div>
      <Badge variant={environmentVariant} class="text-xs">
        {vm.environment}
      </Badge>
    </div>
  </CardHeader>

  <CardContent class="space-y-4">
    <!-- VM Details -->
    <div class="space-y-2 text-sm">
      {#if vm.description}
        <p class="text-muted-foreground">{vm.description}</p>
      {/if}
      
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground">Commands:</span>
        <Badge variant="outline" class="text-xs">
          {commandCount}
        </Badge>
      </div>
      
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground">Created:</span>
        <span class="text-xs">{createdDate}</span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-wrap gap-2 pt-2 border-t">
      <Button
        variant={isSelected ? "default" : "outline"}
        size="sm"
        onclick={handleSelect}
        disabled={isExecuting}
        class="flex-1"
      >
        <Play class="w-3 h-3 mr-1" />
        {isSelected ? 'Selected' : 'Select'}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onclick={handleManageCommands}
        disabled={isExecuting}
      >
        <Settings class="w-3 h-3 mr-1" />
        Commands
      </Button>

      <div class="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onclick={handleEdit}
          disabled={isExecuting}
        >
          <Edit class="w-3 h-3" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onclick={handleDelete}
          disabled={isExecuting}
          class="text-destructive hover:text-destructive"
        >
          <Trash2 class="w-3 h-3" />
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
