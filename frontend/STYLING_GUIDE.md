# Styling Guide: Using styles.css in Svelte Components

## Core Principles

1. **Use Tailwind semantic classes** - `bg-card`, `text-primary`, `border-border`
2. **Never hardcode colors** - No `bg-red-500`, use `bg-destructive`
3. **Leverage CSS custom properties** - Available via Tailwind's theme system
4. **Consistent spacing** - Use Tailwind spacing scale

## Available Color Tokens

### Backgrounds
- `bg-background` - Main app background
- `bg-card` - Card/panel backgrounds
- `bg-muted` - Subtle backgrounds
- `bg-popover` - Overlay backgrounds

### Text Colors
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `text-primary` - Accent text
- `text-destructive` - Error text

### Borders & Inputs
- `border-border` - Standard borders
- `border-input` - Input borders
- `ring-ring` - Focus rings

## Component Examples

### Panel Component
```svelte
<div class="bg-card border-border text-card-foreground">
  <!-- Content -->
</div>
```

### Button States
```svelte
<button class="bg-primary text-primary-foreground hover:bg-primary/90">
  Primary Button
</button>
```

### Error States
```svelte
<div class="bg-destructive/10 text-destructive border-destructive/20">
  Error message
</div>
```

## Dark Theme Color Hierarchy

### Backgrounds (Darkest to Lightest)
- `bg-background` - Main app background (#404258)
- `bg-sidebar` - Sidebar background (slightly darker)
- `bg-card` - Card/panel backgrounds (#474E68)
- `bg-muted` - Subtle element backgrounds
- `bg-accent` - Interactive element backgrounds

### Interactive Elements
- `bg-primary` - Primary buttons/actions (#6B728E)
- `bg-secondary` - Secondary buttons (#50577A)
- `hover:bg-primary/90` - Hover states
- `hover:bg-accent` - Subtle hover states

### Text Hierarchy
- `text-foreground` - Primary text (high contrast)
- `text-card-foreground` - Card text
- `text-muted-foreground` - Secondary text (medium contrast)
- `text-primary` - Accent text
- `text-destructive` - Error text

### Borders & Separators
- `border-border` - Standard borders (subtle)
- `border-sidebar-border` - Sidebar borders
- `border-input` - Input borders
- `divide-border` - List separators

## Component Patterns

### Sidebar Pattern
```svelte
<div class="bg-sidebar border-r border-sidebar-border">
  <div class="p-4 border-b border-sidebar-border">
    <h2 class="text-sidebar-foreground font-semibold">Title</h2>
  </div>
  <div class="p-2">
    <button class="w-full text-left p-2 rounded hover:bg-sidebar-accent text-sidebar-foreground">
      Item
    </button>
  </div>
</div>
```

### Card Pattern
```svelte
<div class="bg-card border border-border rounded-lg p-4">
  <h3 class="text-card-foreground font-medium">Card Title</h3>
  <p class="text-muted-foreground text-sm">Description</p>
</div>
```

### Status Indicators
```svelte
<!-- Success -->
<div class="bg-green-500/10 text-green-400 border border-green-500/20">
  Success message
</div>

<!-- Error -->
<div class="bg-destructive/10 text-destructive border border-destructive/20">
  Error message
</div>

<!-- Warning -->
<div class="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
  Warning message
</div>
```
