<!--
  VM Sync Panel Component
  
  Provides SSH config synchronization and VM discovery functionality.
  Allows users to discover VMs from ~/.ssh/config and sync with the database.
-->

<script>
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { 
    RefreshCw, 
    Plus, 
    AlertTriangle, 
    CheckCircle2, 
    Server,
    Cloud,
    Loader2
  } from 'lucide-svelte';
  import { sshHostService } from '$lib/services/SSHHostService.js';

  export let vms = [];
  export let loading = false;

  const dispatch = createEventDispatcher();

  let syncData = null;
  let syncing = false;
  let error = null;

  async function performSync() {
    syncing = true;
    error = null;
    
    try {
      syncData = await sshHostService.syncWithSSHConfig(vms);
    } catch (err) {
      console.error('Sync failed:', err);
      error = err.message;
    } finally {
      syncing = false;
    }
  }

  function createVMFromSSHHost(suggestion) {
    dispatch('create-vm', {
      vmData: suggestion.suggestedVM,
      sshHost: suggestion.sshHost
    });
  }

  function updateVMFromSync(suggestion) {
    dispatch('update-vm', {
      vm: suggestion.vm,
      updates: suggestion.suggestedUpdates
    });
  }

  function removeOrphanedVM(suggestion) {
    dispatch('remove-vm', {
      vm: suggestion.vm,
      reason: suggestion.reason
    });
  }

  $: hasNewHosts = syncData?.suggestions?.create?.length > 0;
  $: hasUpdates = syncData?.suggestions?.update?.length > 0;
  $: hasOrphaned = syncData?.suggestions?.remove?.length > 0;
  $: hasSuggestions = hasNewHosts || hasUpdates || hasOrphaned;
</script>

<Card>
  <CardHeader>
    <CardTitle class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <RefreshCw class="w-5 h-5" />
        SSH Config Sync
      </div>
      <Button
        variant="outline"
        size="sm"
        onclick={performSync}
        disabled={syncing || loading}
      >
        {#if syncing}
          <Loader2 class="w-3 h-3 mr-1 animate-spin" />
        {:else}
          <RefreshCw class="w-3 h-3 mr-1" />
        {/if}
        Sync Now
      </Button>
    </CardTitle>
  </CardHeader>

  <CardContent class="space-y-4">
    {#if error}
      <div class="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
        <AlertTriangle class="w-4 h-4 text-destructive" />
        <span class="text-sm text-destructive">{error}</span>
      </div>
    {/if}

    {#if syncing}
      <div class="flex items-center justify-center py-8">
        <Loader2 class="w-6 h-6 animate-spin mr-2" />
        <span class="text-muted-foreground">Syncing with SSH config...</span>
      </div>
    {:else if !syncData}
      <div class="text-center py-8">
        <RefreshCw class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p class="text-muted-foreground">Click "Sync Now" to discover VMs from ~/.ssh/config</p>
      </div>
    {:else if !hasSuggestions}
      <div class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle2 class="w-4 h-4 text-green-600" />
        <span class="text-sm text-green-700">All VMs are in sync with SSH config</span>
      </div>
    {:else}
      <div class="space-y-4">
        <!-- New SSH Hosts -->
        {#if hasNewHosts}
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <Plus class="w-4 h-4 text-green-600" />
              <h4 class="font-medium text-green-700">New SSH Hosts Discovered</h4>
              <Badge variant="secondary" class="text-xs">
                {syncData.suggestions.create.length}
              </Badge>
            </div>
            
            <div class="space-y-2">
              {#each syncData.suggestions.create as suggestion}
                <div class="flex items-center justify-between p-3 border rounded-lg">
                  <div class="flex items-center gap-3">
                    <div class="p-1.5 bg-primary/10 rounded">
                      {#if suggestion.sshHost.isCloudInstance}
                        <Cloud class="w-3 h-3 text-primary" />
                      {:else}
                        <Server class="w-3 h-3 text-primary" />
                      {/if}
                    </div>
                    <div>
                      <div class="font-medium text-sm">{suggestion.sshHost.alias}</div>
                      <div class="text-xs text-muted-foreground">
                        {suggestion.sshHost.user}@{suggestion.sshHost.hostname}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="text-right">
                      <div class="text-xs font-medium">{suggestion.suggestedVM.name}</div>
                      {#if suggestion.sshHost.cloudProvider}
                        <div class="text-xs text-muted-foreground">{suggestion.sshHost.cloudProvider}</div>
                      {/if}
                    </div>
                    <Button
                      size="sm"
                      onclick={() => createVMFromSSHHost(suggestion)}
                      disabled={loading}
                    >
                      <Plus class="w-3 h-3 mr-1" />
                      Create VM
                    </Button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Outdated VMs -->
        {#if hasUpdates}
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <AlertTriangle class="w-4 h-4 text-orange-600" />
              <h4 class="font-medium text-orange-700">VMs Need Updates</h4>
              <Badge variant="secondary" class="text-xs">
                {syncData.suggestions.update.length}
              </Badge>
            </div>
            
            <div class="space-y-2">
              {#each syncData.suggestions.update as suggestion}
                <div class="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div class="font-medium text-sm">{suggestion.vm.name}</div>
                    <div class="text-xs text-muted-foreground">
                      SSH config has been updated
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onclick={() => updateVMFromSync(suggestion)}
                    disabled={loading}
                  >
                    Update VM
                  </Button>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Orphaned VMs -->
        {#if hasOrphaned}
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <AlertTriangle class="w-4 h-4 text-red-600" />
              <h4 class="font-medium text-red-700">Orphaned VMs</h4>
              <Badge variant="destructive" class="text-xs">
                {syncData.suggestions.remove.length}
              </Badge>
            </div>
            
            <div class="space-y-2">
              {#each syncData.suggestions.remove as suggestion}
                <div class="flex items-center justify-between p-3 border border-red-200 rounded-lg">
                  <div>
                    <div class="font-medium text-sm">{suggestion.vm.name}</div>
                    <div class="text-xs text-red-600">{suggestion.reason}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onclick={() => removeOrphanedVM(suggestion)}
                    disabled={loading}
                  >
                    Remove VM
                  </Button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </CardContent>
</Card>
