<!--
  Modal Component
  
  Reusable modal component following TailwindCSS utility-first principles.
  Uses Svelte 5 syntax with $props() and provides consistent modal behavior.
-->

<script>
  import { X } from '@lucide/svelte';
  import { Button } from './button';

  let {
    isOpen = false,
    onClose = () => {},
    title = '',
    size = 'default', // 'sm' | 'default' | 'lg' | 'xl'
    showCloseButton = true,
    closeOnOverlayClick = true,
    children
  } = $props();

  // Size variants using Tailwind classes
  const sizeClasses = {
    sm: 'max-w-md',
    default: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  function handleOverlayClick(event) {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      onClose();
    }
  }
</script>

{#if isOpen}
  <!-- Modal Overlay -->
  <div 
    class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    onclick={handleOverlayClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? 'modal-title' : undefined}
  >
    <!-- Modal Content -->
    <div 
      class="bg-white rounded-lg shadow-xl {sizeClasses[size]} w-full max-h-[90vh] overflow-hidden"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      {#if title || showCloseButton}
        <div class="flex items-center justify-between p-6 border-b">
          {#if title}
            <h2 id="modal-title" class="text-xl font-semibold text-gray-900">
              {title}
            </h2>
          {:else}
            <div></div>
          {/if}
          
          {#if showCloseButton}
            <Button variant="ghost" size="sm" onclick={onClose}>
              <X class="w-4 h-4" />
            </Button>
          {/if}
        </div>
      {/if}

      <!-- Content -->
      <div class="overflow-y-auto max-h-[calc(90vh-8rem)]">
        {@render children()}
      </div>
    </div>
  </div>
{/if}
