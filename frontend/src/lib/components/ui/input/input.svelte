<script>
  import { cn } from "$lib/utils.js";

  let className = undefined;
  export { className as class };
  export let value = "";
  export let placeholder = "";
  export let type = "text";
  export let disabled = false;
  export let readonly = false;
  export let id = undefined;
  export let name = undefined;
  export let min = undefined;
  export let max = undefined;
  export let step = undefined;
</script>

<input
  {id}
  {name}
  {type}
  {placeholder}
  {disabled}
  {readonly}
  {min}
  {max}
  {step}
  bind:value
  class={cn(
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  {...$$restProps}
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
/>
