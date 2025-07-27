<script>
  import { cn } from "$lib/utils.js";

  let { class: className = undefined, ...restProps } = $props();
</script>

<div
  class={cn(
    "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
    className
  )}
  {...restProps}
>
  <slot />
</div>
