<!--
  @component Label

  A semantic label component that provides proper form control association and accessibility.

  @example
  ```svelte
  <script>
    import { Label } from "$lib/components/ui/label";
  </script>

  <!-- Basic usage -->
  <Label for="email">Email Address</Label>
  <input id="email" type="email" />

  <!-- With custom styling -->
  <Label for="password" class="text-lg font-bold">Password</Label>
  <input id="password" type="password" />

  <!-- With required indicator -->
  <Label for="name" required>Full Name</Label>
  <input id="name" type="text" required />
  ```

  @prop {string} [for] - The ID of the form control this label is associated with
  @prop {string} [class] - Additional CSS classes to apply to the label
  @prop {boolean} [required=false] - Whether to show a required indicator (*)
  @prop {string} [requiredIndicator="*"] - Custom required indicator text/symbol

  @slot default - The label text content
-->

<script>
  import { cn } from "$lib/utils.js";

  let {
    class: className,
    htmlFor = undefined,
    fors = undefined,
    required = false,
    requiredIndicator = "*",
    children,
    ...restProps
  } = $props();

  // Determine the final 'for' value, prioritizing 'htmlFor' over deprecated 'fors'
  const forValue = $derived(htmlFor ?? fors);
</script>

<label
  for={forValue}
  class={cn(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    className
  )}
  {...restProps}
>
  {@render children?.()}
  {#if required}
    <span class="ml-1 text-destructive" aria-label="required">
      {requiredIndicator}
    </span>
  {/if}
</label>
