<!--
  VM List Component
  
  Displays a list of VMs with their status, command counts, and action buttons.
  Handles VM selection, editing, and deletion.
-->

<script>
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { 
    Server, 
    Edit, 
    Trash2, 
    Terminal, 
    Settings,
    ExternalLink,
    Loader2
  } from 'lucide-svelte';
  import VM from './VM.svelte';
  import { getEnvironmentDisplay, formatVMConnection } from './vm.js';

  export let vms = [];
  export let commandCounts = {};
  export let selectedVMId = null;
  export let loading = false;
  export let executing = false;

  const dispatch = createEventDispatcher();

  function handleVMSelect(vm) {
    dispatch('vm-select', vm);
  }

  function handleVMEdit(vm) {
    dispatch('vm-edit', vm);
  }

  function handleVMDelete(vm) {
    dispatch('vm-delete', vm);
  }

  function handleManageCommands(vm) {
    dispatch('manage-commands', vm);
  }

  function handleVMConnect(vm) {
    dispatch('vm-connect', vm);
  }

  $: sortedVMs = vms.sort((a, b) => {
    // Sort by environment first, then by name
    const envA = getEnvironmentDisplay(a.environment);
    const envB = getEnvironmentDisplay(b.environment);
    
    if (envA.value !== envB.value) {
      const envOrder = ['production', 'staging', 'development', 'testing'];
      return envOrder.indexOf(envA.value) - envOrder.indexOf(envB.value);
    }
    
    return a.name.localeCompare(b.name);
  });
</script>

<div class="space-y-4">
  {#if loading}
    <div class="flex items-center justify-center py-8">
      <Loader2 class="w-6 h-6 animate-spin mr-2" />
      <span class="text-muted-foreground">Loading VMs...</span>
    </div>
  {:else if vms.length === 0}
    <Card>
      <CardContent class="pt-8 pb-8 text-center">
        <Server class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 class="text-lg font-medium mb-2">No VMs Found</h3>
        <p class="text-muted-foreground mb-4">
          Create your first virtual machine to get started
        </p>
        <Button onclick={() => dispatch('create-vm')}>
          <Server class="w-4 h-4 mr-2" />
          Create VM
        </Button>
      </CardContent>
    </Card>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each sortedVMs as vm (vm.id)}
        {@const envDisplay = getEnvironmentDisplay(vm.environment)}
        {@const commandCount = commandCounts[vm.id] || 0}
        {@const isSelected = selectedVMId === vm.id}
        
        <Card class="transition-all duration-200 {isSelected ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md'}">
          <CardHeader class="pb-3">
            <div class="flex items-start justify-between">
              <div class="min-w-0 flex-1">
                <CardTitle class="text-base flex items-center gap-2">
                  <Server class="w-4 h-4 text-primary" />
                  <span class="truncate">{vm.name}</span>
                  {#if isSelected}
                    <Badge variant="secondary" class="text-xs">Selected</Badge>
                  {/if}
                </CardTitle>
                <p class="text-xs text-muted-foreground mt-1 font-mono">
                  {formatVMConnection(vm)}
                </p>
              </div>
              <Badge 
                variant="outline" 
                class="text-xs"
                style="border-color: var(--{envDisplay.color}-500); color: var(--{envDisplay.color}-600);"
              >
                {envDisplay.label}
              </Badge>
            </div>
          </CardHeader>

          <CardContent class="space-y-3">
            <!-- VM Description -->
            {#if vm.description}
              <p class="text-sm text-muted-foreground line-clamp-2">
                {vm.description}
              </p>
            {/if}

            <!-- VM Stats -->
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-1">
                <Terminal class="w-3 h-3" />
                <span>{commandCount} command{commandCount !== 1 ? 's' : ''}</span>
              </div>
              {#if vm.sshHost}
                <Badge variant="outline" class="text-xs">
                  SSH: {vm.sshHost}
                </Badge>
              {/if}
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 pt-2 border-t">
              <Button
                variant={isSelected ? "secondary" : "default"}
                size="sm"
                onclick={() => handleVMSelect(vm)}
                disabled={executing}
                class="flex-1"
              >
                {#if isSelected}
                  <Settings class="w-3 h-3 mr-1" />
                  Selected
                {:else}
                  <ExternalLink class="w-3 h-3 mr-1" />
                  Select
                {/if}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onclick={() => handleManageCommands(vm)}
                disabled={executing}
                title="Manage Commands"
              >
                <Terminal class="w-3 h-3" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onclick={() => handleVMEdit(vm)}
                disabled={executing}
                title="Edit VM"
              >
                <Edit class="w-3 h-3" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onclick={() => handleVMDelete(vm)}
                disabled={executing}
                class="text-destructive hover:text-destructive"
                title="Delete VM"
              >
                <Trash2 class="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
