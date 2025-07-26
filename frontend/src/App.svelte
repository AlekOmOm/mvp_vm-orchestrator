<script>
  import Dashboard from './lib/components/Dashboard.svelte'; // Main component
  import './styles/styles.css'; // Global styles
</script>

<main>
  <Dashboard />
</main>

<style>
  main {
    min-height: 100vh;
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', sans-serif;
  }
</style>
