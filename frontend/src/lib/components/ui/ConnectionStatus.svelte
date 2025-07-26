<!--
  Connection Status Component
  
  Displays the current connection status with a visual indicator.
  Provides a reusable way to show connection state across the application.
-->

<script>
  export let connectionStatus = null;
  export let size = 'sm'; // 'sm', 'md', 'lg'
  export let showText = true;
  export let className = '';

  // Size configurations
  const sizeConfig = {
    sm: {
      dot: 'w-2 h-2',
      text: 'text-sm'
    },
    md: {
      dot: 'w-3 h-3',
      text: 'text-base'
    },
    lg: {
      dot: 'w-4 h-4',
      text: 'text-lg'
    }
  };

  $: config = sizeConfig[size] || sizeConfig.sm;
  $: status = connectionStatus ? $connectionStatus : 'disconnected';
  $: isConnected = status === 'connected';
  $: statusColor = isConnected ? 'bg-green-500' : 'bg-red-500';
  $: statusText = status.charAt(0).toUpperCase() + status.slice(1);
</script>

<div class="flex items-center space-x-2 {className}">
  <div class="{config.dot} rounded-full {statusColor}"></div>
  {#if showText}
    <span class="{config.text} text-gray-600 capitalize">{statusText}</span>
  {/if}
</div>
