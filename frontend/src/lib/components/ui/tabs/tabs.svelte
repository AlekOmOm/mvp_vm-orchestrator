<script>
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { cn } from "$lib/utils.js";

  let className = undefined;
  export { className as class };
  export let value = "";

  const activeTab = writable(value);
  setContext('tabs', activeTab);

  $: activeTab.set(value);
</script>

<div class={cn("w-full", className)} {...$$restProps}>
  <slot />
</div>
