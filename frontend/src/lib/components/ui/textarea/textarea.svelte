<script>
  import { cn } from "$lib/utils.js";

  let {
    class: className = undefined,
    value = "",
    placeholder = "",
    disabled = false,
    readonly = false,
    id = undefined,
    name = undefined,
    rows = 3,
    cols = undefined,
    ...restProps
  } = $props();
</script>

<textarea
  {id}
  {name}
  {placeholder}
  {disabled}
  {readonly}
  {rows}
  {cols}
  bind:value
  class={cn(
    "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  {...restProps}
  on:blur
  on:change
  on:click
  on:focus
  on:focusin
  on:focusout
  on:keydown
  on:keypress
  on:keyup
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:paste
  on:input
></textarea>
