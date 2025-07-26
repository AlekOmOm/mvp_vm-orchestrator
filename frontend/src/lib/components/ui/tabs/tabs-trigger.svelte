<script>
  import { getContext } from 'svelte';
  import { cn } from "$lib/utils.js";

  let className = undefined;
  export { className as class };
  export let value = "";

  const activeTab = getContext('tabs');

  function handleClick() {
    activeTab.set(value);
  }

  $: isActive = $activeTab === value;
</script>

<button
  type="button"
  class={cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
    className
  )}
  on:click={handleClick}
  {...$$restProps}
>
  <slot />
</button>
