<!--
  Panel Component
  
  Reusable panel component for consistent layout patterns.
  Uses Tailwind utility classes for styling.
-->

<script>
  let {
    variant = 'default',
    class: className = '',
    children
  } = $props();

  const variantClasses = {
    sidebar: 'w-[20vw] min-w-[300px] max-w-[400px] flex-shrink-0 bg-card border-r border-border',
    main: 'flex-1 min-h-0 bg-background',
    default: 'bg-card border border-border rounded-lg'
  };
</script>

<div class="{variantClasses[variant]} {className}">
  {@render children()}
</div>
