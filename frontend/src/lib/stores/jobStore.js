/**
 * Job Store
 *
 * Enhanced job store using base store pattern for consistent state management.
 * Provides reactive state management for job history and caching.
 *
 * @fileoverview Job state management store
 */

import { derived } from 'svelte/store';
import { createBaseStore, withLoadingState } from './baseStore.js';
import { jobService } from '../services/ApiService.js';
import { selectedVM } from './vmStore.js';

/**
 * Create job store with enhanced base store functionality
 */
function createJobStore() {
  // Initial state
  const initialState = {
    jobs: [],
    jobsByVM: {}, // Cache jobs by VM ID
    currentJob: null,
    loading: false,
    error: null,
  };

  // Create base store with logging enabled
  const baseStore = createBaseStore(initialState, {
    name: 'JobStore',
    enableLogging: true
  });

  return {
    ...baseStore,

    /**
     * Load job history from API
     */
    async loadJobs() {
      return withLoadingState(baseStore, async () => {
        const jobs = await jobService.getJobs();
        
        baseStore.updateWithLoading(state => ({
          ...state,
          jobs
        }), false);
        
        return jobs;
      }, { operationName: 'loadJobs', logOperation: true });
    },

    /**
     * Load cached jobs for a specific VM
     * @param {string} vmId - VM ID
     * @param {Object} options - Query options
     */
    async loadVMJobs(vmId, options = {}) {
      if (!vmId) return;
      
      return withLoadingState(baseStore, async () => {
        const jobs = await jobService.getVMJobs(vmId, options);
        
        baseStore.updateWithLoading(state => ({ 
          ...state, 
          jobsByVM: {
            ...state.jobsByVM,
            [vmId]: jobs
          }
        }), false);
        
        return jobs;
      }, { operationName: `loadVMJobs(${vmId})`, logOperation: true });
    },

    /**
     * Set current executing job
     * @param {Object|null} job - Current job or null
     */
    setCurrentJob(job) {
      baseStore.setState({ currentJob: job });
    },

    /**
     * Add a new job to the history
     * @param {Object} job - Job object
     */
    addJob(job) {
      baseStore.updateWithLoading(state => ({
        ...state,
        jobs: [job, ...state.jobs].slice(0, 100) // Keep last 100 jobs
      }), false);
    },

    /**
     * Update job status
     * @param {string} jobId - Job ID
     * @param {Object} updates - Job updates
     */
    updateJob(jobId, updates) {
      baseStore.updateWithLoading(state => ({
        ...state,
        jobs: state.jobs.map(job => 
          job.id === jobId ? { ...job, ...updates } : job
        ),
        currentJob: state.currentJob?.id === jobId 
          ? { ...state.currentJob, ...updates }
          : state.currentJob
      }), false);
    },

    /**
     * Remove job from history
     * @param {string} jobId - Job ID
     */
    removeJob(jobId) {
      baseStore.updateWithLoading(state => ({
        ...state,
        jobs: state.jobs.filter(job => job.id !== jobId),
        currentJob: state.currentJob?.id === jobId ? null : state.currentJob
      }), false);
    },

    /**
     * Clear job history
     */
    clearJobs() {
      baseStore.setState({
        jobs: [],
        jobsByVM: {},
        currentJob: null
      });
    },

    /**
     * Get jobs for a specific VM
     * @param {string} vmId - VM ID
     * @returns {Array} Jobs for the VM
     */
    getJobsForVM(vmId) {
      const state = baseStore.getValue();
      return state.jobsByVM[vmId] || [];
    },

    /**
     * Get job by ID
     * @param {string} jobId - Job ID
     * @returns {Object|null} Job object or null
     */
    getJobById(jobId) {
      const state = baseStore.getValue();
      return state.jobs.find(job => job.id === jobId) || null;
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

// Derived store for execution state
export const isExecuting = derived(currentJob, $currentJob => !!$currentJob);

// Derived store for current VM jobs
export const currentVMJobs = derived(
  [jobStore, selectedVM], 
  ([$jobStore, $selectedVM]) => {
    if (!$selectedVM) return [];
    return $jobStore.jobsByVM[$selectedVM.id] || [];
  }
);

// Additional derived stores
export const recentJobs = derived(jobs, $jobs => $jobs.slice(0, 10));
export const failedJobs = derived(jobs, $jobs => $jobs.filter(job => job.status === 'failed'));
export const successfulJobs = derived(jobs, $jobs => $jobs.filter(job => job.status === 'completed'));

// Job statistics
export const jobStats = derived(jobs, $jobs => {
  const total = $jobs.length;
  const completed = $jobs.filter(job => job.status === 'completed').length;
  const failed = $jobs.filter(job => job.status === 'failed').length;
  const running = $jobs.filter(job => job.status === 'running').length;
  
  return {
    total,
    completed,
    failed,
    running,
    successRate: total > 0 ? (completed / total * 100).toFixed(1) : 0
  };
});
