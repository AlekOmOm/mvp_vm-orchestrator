<script>
  import JobSimple from './JobSimple.svelte';
  let { jobs = [] } = $props();
</script>

<div class="job-list">
{#each jobs as job (job.id)}
    <JobSimple {job} />
{/each}
</div> 

<style>
    .job-list {
        padding: 2vh;
    }
</style>