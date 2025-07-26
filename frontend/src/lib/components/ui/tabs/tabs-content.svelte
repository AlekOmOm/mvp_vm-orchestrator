<script>
  import { getContext } from 'svelte';
  import { cn } from "$lib/utils.js";

  let className = undefined;
  export { className as class };
  let value = "";

  const activeTab = getContext('tabs');

  $: isActive = $activeTab === value;
</script>

{#if isActive}
  <div
    class={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...$$restProps}
  >
    <slot />
  </div>
{/if}
