<script>
import { theme } from '$lib/stores/themeStore.js';
import { Sun, Moon } from 'lucide-svelte';
function toggle(){ theme.set($theme==='dark'?'light':'dark'); }
</script>

<button class="w-10 h-10 flex items-center justify-center rounded-full border bg-card text-card-foreground" onclick={toggle}>
  {#if $theme==='dark'}
    <Sun class="w-5 h-5" />
  {:else}
    <Moon class="w-5 h-5" />
  {/if}
</button> 