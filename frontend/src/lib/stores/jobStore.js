/**
 * Job Store
 *
 * Svelte store for managing job state and operations.
 * Provides reactive state management for job history and caching.
 *
 * @fileoverview Job state management store
 */

import { writable, derived } from 'svelte/store';
import { jobService } from '../services/ApiService.js';
import { selectedVM } from './vmStore.js';

/**
 * Create job store with reactive state management
 */
function createJobStore() {
  // Core state
  const { subscribe, set, update } = writable({
    jobs: [],
    jobsByVM: {}, // Cache jobs by VM ID
    currentJob: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load job history from API
     */
    async loadJobs() {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const jobs = await jobService.getJobs();
        update(state => ({ 
          ...state, 
          jobs, 
          loading: false 
        }));
      } catch (error) {
        console.error('Failed to load jobs:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: error.message 
        }));
      }
    },

    /**
     * Load cached jobs for a specific VM
     * @param {string} vmId - VM ID
     * @param {Object} options - Query options
     */
    async loadVMJobs(vmId, options = {}) {
      if (!vmId) return;
      
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const jobs = await jobService.getVMJobs(vmId, options);
        update(state => ({ 
          ...state, 
          jobsByVM: {
            ...state.jobsByVM,
            [vmId]: jobs
          },
          loading: false 
        }));
      } catch (error) {
        console.error('Failed to load VM jobs:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: error.message 
        }));
      }
    },

    /**
     * Set current executing job
     * @param {Object|null} job - Current job or null
     */
    setCurrentJob(job) {
      update(state => ({ ...state, currentJob: job }));
    },

    /**
     * Add a new job to the history
     * @param {Object} job - Job object
     */
    addJob(job) {
      update(state => ({
        ...state,
        jobs: [job, ...state.jobs].slice(0, 100) // Keep last 100 jobs
      }));
    },

    /**
     * Update job status
     * @param {string} jobId - Job ID
     * @param {Object} updates - Job updates
     */
    updateJob(jobId, updates) {
      update(state => ({
        ...state,
        jobs: state.jobs.map(job => 
          job.id === jobId ? { ...job, ...updates } : job
        ),
        currentJob: state.currentJob?.id === jobId 
          ? { ...state.currentJob, ...updates }
          : state.currentJob
      }));
    },

    /**
     * Get jobs for a specific VM from cache
     * @param {string} vmId - VM ID
     * @returns {Array} Jobs for the VM
     */
    getVMJobs(vmId) {
      let jobs = [];
      const unsubscribe = subscribe(state => {
        jobs = state.jobsByVM[vmId] || [];
      });
      unsubscribe();
      return jobs;
    },

    /**
     * Clear error state
     */
    clearError() {
      update(state => ({ ...state, error: null }));
    },

    /**
     * Reset store to initial state
     */
    reset() {
      set({
        jobs: [],
        jobsByVM: {},
        currentJob: null,
        loading: false,
        error: null,
      });
    }
  };
}

// Create and export the store instance
export const jobStore = createJobStore();

// Derived stores for convenience
export const jobs = derived(jobStore, $jobStore => $jobStore.jobs);
export const currentJob = derived(jobStore, $jobStore => $jobStore.currentJob);
export const jobLoading = derived(jobStore, $jobStore => $jobStore.loading);
export const jobError = derived(jobStore, $jobStore => $jobStore.error);

// Derived store for current VM's jobs
export const currentVMJobs = derived(
  [jobStore, selectedVM],
  ([$jobStore, $selectedVM]) => {
    if (!$selectedVM) return [];
    return $jobStore.jobsByVM[$selectedVM.id] || [];
  }
);

// Derived store for job statistics
export const jobStats = derived(jobs, $jobs => {
  const stats = {
    total: $jobs.length,
    running: 0,
    success: 0,
    failed: 0,
    recent: $jobs.slice(0, 10)
  };

  $jobs.forEach(job => {
    switch (job.status) {
      case 'running':
        stats.running++;
        break;
      case 'success':
        stats.success++;
        break;
      case 'failed':
        stats.failed++;
        break;
    }
  });

  return stats;
});

// Derived store for execution status
export const isExecuting = derived(currentJob, $currentJob => !!$currentJob);
