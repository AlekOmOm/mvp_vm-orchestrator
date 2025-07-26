<!--
  VM Selector Component
  
  Dropdown component for selecting a VM for command execution.
  Shows VM status, environment, and command count.
-->

<script>
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Select } from '$lib/components/ui/select';
  import { 
    Server, 
    ChevronDown, 
    CheckCircle2, 
    AlertCircle,
    Settings
  } from 'lucide-svelte';
  import { vms, selectedVM, vmLoading } from '../../stores/vmStore.js';
  import { currentVMCommands } from '../../stores/commandStore.js';

  const dispatch = createEventDispatcher();

   let disabled = false;
   let showManageButton = true;

  function handleVMChange(event) {
    const vmId = event.target.value;
    const vm = $vms.find(v => v.id === vmId) || null;
    dispatch('vm-selected', vm);
  }

  function handleManageVMs() {
    dispatch('manage-vms');
  }

  // Get environment badge variant
  function getEnvironmentVariant(environment) {
    return {
      'development': 'secondary',
      'staging': 'outline', 
      'production': 'destructive'
    }[environment] || 'outline';
  }

  $: vmOptions = $vms.map(vm => ({
    value: vm.id,
    label: `${vm.name} (${vm.environment})`,
    vm
  }));

  $: selectedVMId = $selectedVM?.id || '';
  $: commandCount = $currentVMCommands.length;
  $: hasVMs = $vms.length > 0;
</script>

<Card class="w-full">
  <CardHeader class="pb-3">
    <CardTitle class="text-base flex items-center gap-2">
      <Server class="w-4 h-4" />
      Target VM
      {#if $selectedVM}
        <CheckCircle2 class="w-4 h-4 text-green-600" />
      {/if}
    </CardTitle>
  </CardHeader>

  <CardContent class="space-y-3">
    {#if $vmLoading}
      <div class="flex items-center gap-2 text-muted-foreground">
        <div class="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin"></div>
        Loading VMs...
      </div>
    {:else if !hasVMs}
      <div class="text-center py-4">
        <AlertCircle class="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p class="text-sm text-muted-foreground mb-3">No VMs configured</p>
        {#if showManageButton}
          <Button size="sm" onclick={handleManageVMs}>
            <Settings class="w-3 h-3 mr-1" />
            Manage VMs
          </Button>
        {/if}
      </div>
    {:else}
      <!-- VM Selection -->
      <div class="space-y-2">
        <Select
          value={selectedVMId}
          on:change={handleVMChange}
          disabled={disabled || $vmLoading}
          class="w-full"
        >
          <option value="">Select a VM...</option>
          {#each vmOptions as option}
            <option value={option.value}>
              {option.label}
            </option>
          {/each}
        </Select>

        {#if showManageButton}
          <Button variant="outline" size="sm" onclick={handleManageVMs} class="w-full">
            <Settings class="w-3 h-3 mr-1" />
            Manage VMs
          </Button>
        {/if}
      </div>

      <!-- Selected VM Details -->
      {#if $selectedVM}
        <div class="p-3 bg-muted/50 rounded-lg space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-medium">{$selectedVM.name}</span>
            <Badge variant={getEnvironmentVariant($selectedVM.environment)} class="text-xs">
              {$selectedVM.environment}
            </Badge>
          </div>
          
          <div class="text-sm text-muted-foreground">
            <div class="flex items-center justify-between">
              <span>{$selectedVM.user}@{$selectedVM.host}</span>
              <span>Port: {$selectedVM.port || 22}</span>
            </div>
          </div>

          {#if $selectedVM.description}
            <p class="text-xs text-muted-foreground">{$selectedVM.description}</p>
          {/if}

          <div class="flex items-center justify-between pt-2 border-t border-border">
            <span class="text-xs text-muted-foreground">Available commands:</span>
            <Badge variant="outline" class="text-xs">
              {commandCount}
            </Badge>
          </div>
        </div>
      {:else}
        <div class="p-3 bg-muted/30 rounded-lg text-center">
          <p class="text-sm text-muted-foreground">
            Select a VM to view details and available commands
          </p>
        </div>
      {/if}
    {/if}
  </CardContent>
</Card>
