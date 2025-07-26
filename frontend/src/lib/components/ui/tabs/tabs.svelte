<script>
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { cn } from "$lib/utils.js";

  let { className, value = "", ...restProps } = $props();

  const activeTab = writable(value);
  setContext('tabs', activeTab);

  let activeTab.set(value);
</script>

<div class={cn("w-full", className)} {...restProps}>
  <slot />
</div>
