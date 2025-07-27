/**
 * Job Store
 *
 * Enhanced job store using base store pattern for consistent state management.
 * Provides reactive state management for job history and caching.
 * Now integrated with the new service architecture.
 *
 * @fileoverview Job state management store
 */

import { derived } from "svelte/store";
import { createBaseStore, withLoadingState } from "./baseStore.js";
import { serviceContainer } from "../core/ServiceContainer.js";
import { selectedVM } from "./vmStore.js";
import { logStore } from "./logStore.js";

async function fetchAndStoreLogs(jobService, jobId) {
   try {
      const data = await jobService.fetchJobLogs(jobId);
      logStore.addLogLines(jobId, data);
   } catch (_) {}
}

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
      lastFetch: null, // Track when jobs were last fetched
      cacheTimeout: 5 * 60 * 1000, // 5 minutes cache timeout
      stats: { total: 0, running: 0, success: 0, failed: 0 }, // Job statistics
   };

   // Create base store with logging enabled
   const baseStore = createBaseStore(initialState, {
      name: "JobStore",
      enableLogging: true,
   });

   // Helper function to calculate job statistics
   const calculateJobStats = (jobs) => {
      const total = jobs.length;
      const running = jobs.filter((job) => job.status === "running").length;
      const success = jobs.filter(
         (job) => job.status === "completed" || job.status === "success"
      ).length;
      const failed = jobs.filter((job) => job.status === "failed").length;

      return {
         total,
         running,
         success,
         failed,
         successRate: total > 0 ? ((success / total) * 100).toFixed(1) : 0,
      };
   };

   return {
      ...baseStore,

      /**
       * Initialize the job store by loading initial data
       * @param {boolean} loadJobs - Whether to load jobs during initialization
       */
      async initialize(loadJobs = true) {
         console.log("[JobStore] Initializing job store...");

         if (loadJobs) {
            try {
               await this.loadJobs();
               console.log("[JobStore] Initial jobs loaded successfully");
            } catch (error) {
               console.error("[JobStore] Failed to load initial jobs:", error);
               baseStore.setState({ error: error.message });
            }
         }
      },

      /**
       * Load job history from API with caching
       * @param {boolean} forceRefresh - Force refresh even if cache is valid
       */
      async loadJobs(forceRefresh = false) {
         return withLoadingState(
            baseStore,
            async () => {
               const currentState = baseStore.getValue();
               const now = Date.now();

               // Check if we have cached data and it's still valid
               if (
                  !forceRefresh &&
                  currentState.jobs.length > 0 &&
                  currentState.lastFetch &&
                  now - currentState.lastFetch < currentState.cacheTimeout
               ) {
                  console.log("[JobStore] Using cached jobs data");
                  return currentState.jobs;
               }

               console.log("[JobStore] Fetching fresh jobs data");
               const jobService = serviceContainer.get("jobService");
               const fetched = await jobService.fetchJobs();

               // Smart merge: prioritize WebSocket updates over stale REST data
               const mergedJobsMap = new Map();

               // First add fetched jobs from REST API
               fetched.forEach((job) => {
                  mergedJobsMap.set(job.id, job);
               });

               // Then overlay current jobs, but only if they have more recent data
               currentState.jobs.forEach((currentJob) => {
                  const fetchedJob = mergedJobsMap.get(currentJob.id);

                  if (!fetchedJob) {
                     // Job doesn't exist in fetched data (optimistic job)
                     mergedJobsMap.set(currentJob.id, currentJob);
                  } else {
                     // Job exists in both - merge intelligently
                     const currentFinished =
                        currentJob.finished_at || currentJob.finishedAt;
                     const fetchedFinished =
                        fetchedJob.finished_at || fetchedJob.finishedAt;

                     // If current job has completion data that fetched doesn't, prefer current
                     if (currentFinished && !fetchedFinished) {
                        mergedJobsMap.set(currentJob.id, {
                           ...fetchedJob,
                           ...currentJob,
                        });
                     } else if (
                        currentJob.status !== "running" &&
                        fetchedJob.status === "running"
                     ) {
                        // If current job is completed but fetched is still running, prefer current
                        mergedJobsMap.set(currentJob.id, {
                           ...fetchedJob,
                           ...currentJob,
                        });
                     } else {
                        // Otherwise prefer fetched data but keep any additional fields from current
                        mergedJobsMap.set(currentJob.id, {
                           ...currentJob,
                           ...fetchedJob,
                        });
                     }
                  }
               });

               const jobs = Array.from(mergedJobsMap.values()).sort(
                  (a, b) =>
                     new Date(b.started_at || b.createdAt || 0) -
                     new Date(a.started_at || a.createdAt || 0)
               );

               const stats = calculateJobStats(jobs);

               baseStore.updateWithLoading(
                  (state) => ({
                     ...state,
                     jobs,
                     stats,
                     lastFetch: now,
                  }),
                  false
               );

               return jobs;
            },
            { operationName: "loadJobs", logOperation: true }
         );
      },

      /**
       * Load cached jobs for a specific VM
       * @param {string} vmId - VM ID
       * @param {Object} options - Query options
       */
      async loadVMJobs(vmId, options = {}, withLogLines = false) {
         return withLoadingState(baseStore, async () => {
            const jobService = serviceContainer.get("jobService");
            const fetched = await jobService.fetchVMJobs(vmId, options);

            // Include optimistic jobs from global jobs array
            const globalJobs = baseStore
               .getValue()
               .jobs.filter((j) => j.vmId === vmId);
            const existing = baseStore.getValue().jobsByVM[vmId] || [];

            const mergedMap = new Map();
            [...fetched, ...globalJobs, ...existing].forEach((j) => {
               mergedMap.set(j.id, { ...mergedMap.get(j.id), ...j });
            });

            const jobs = Array.from(mergedMap.values()).sort(
               (a, b) =>
                  new Date(b.started_at || b.createdAt || 0) -
                  new Date(a.started_at || a.createdAt || 0)
            );

            baseStore.updateWithLoading(
               (state) => ({
                  ...state,
                  jobsByVM: { ...state.jobsByVM, [vmId]: jobs },
               }),
               false
            );

            if (withLogLines) {
               for (const j of jobs) {
                  await fetchAndStoreLogs(jobService, j.id);
               }
            }
            return jobs;
         });
      },

      setCurrentJob(job) {
         baseStore.setState({ currentJob: job });
         logStore.setCurrentJob(job);
      },

      /**
       * Force refresh jobs (bypass cache)
       */
      async refreshJobs() {
         return this.loadJobs(true);
      },

      /**
       * Invalidate cache and clear jobs
       */
      invalidateCache() {
         baseStore.setState({
            jobs: [],
            jobsByVM: {},
            lastFetch: null,
         });
      },

      /**
       * Add a new job to the history
       * @param {Object} job - Job object
       */
      addJob(job) {
         baseStore.updateWithLoading((state) => {
            const updatedJobs = [job, ...state.jobs].slice(0, 100);
            const vmJobs = state.jobsByVM[job.vmId] || [];
            return {
               ...state,
               jobs: updatedJobs,
               jobsByVM: {
                  ...state.jobsByVM,
                  [job.vmId]: [job, ...vmJobs].slice(0, 100),
               },
            };
         }, false);
         logStore.setCurrentJob(job);
      },

      /**
       * Update job status
       * @param {string} jobId - Job ID
       * @param {Object} updates - Job updates
       */
      updateJob(jobId, updates) {
         baseStore.updateWithLoading(
            (state) => ({
               ...state,
               jobs: state.jobs.map((job) =>
                  job.id === jobId ? { ...job, ...updates } : job
               ),
               currentJob:
                  state.currentJob?.id === jobId
                     ? { ...state.currentJob, ...updates }
                     : state.currentJob,
            }),
            false
         );
         logStore.setCurrentJob(null);
      },

      /**
       * Remove job from history
       * @param {string} jobId - Job ID
       */
      removeJob(jobId) {
         baseStore.updateWithLoading(
            (state) => ({
               ...state,
               jobs: state.jobs.filter((job) => job.id !== jobId),
               currentJob:
                  state.currentJob?.id === jobId ? null : state.currentJob,
            }),
            false
         );
      },

      /**
       * Clear job history
       */
      clearJobs() {
         baseStore.setState({
            jobs: [],
            jobsByVM: {},
            currentJob: null,
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
         return state.jobs.find((job) => job.id === jobId) || null;
      },
   };
}

// Create and export the store instance
export const jobStore = createJobStore();

// Derived stores for convenience
export const jobs = derived(jobStore, ($jobStore) => $jobStore.jobs);
export const jobsWithLogs = derived(jobStore, ($jobStore) => {
   return $jobStore.jobs.map((job) => ({
      ...job,
      logLines: logStore.getLogLinesForJob(job.id),
   }));
});
export const currentJob = derived(
   jobStore,
   ($jobStore) => $jobStore.currentJob
);
export const jobLoading = derived(jobStore, ($jobStore) => $jobStore.loading);
export const jobError = derived(jobStore, ($jobStore) => $jobStore.error);

// Job statistics from store state
export const jobStats = derived(jobStore, ($jobStore) => $jobStore.stats);

// Derived store for execution state
export const isExecuting = derived(currentJob, ($currentJob) => !!$currentJob);

// Derived store for current VM jobs
export const currentVMJobs = derived(
   [jobStore, selectedVM],
   ([$jobStore, $selectedVM]) => {
      if (!$selectedVM) return [];
      return $jobStore.jobsByVM[$selectedVM.id] || [];
   }
);

// Additional derived stores
export const recentJobs = derived(jobs, ($jobs) => $jobs.slice(0, 10));
export const failedJobs = derived(jobs, ($jobs) =>
   $jobs.filter((job) => job.status === "failed")
);
export const successfulJobs = derived(jobs, ($jobs) =>
   $jobs.filter((job) => job.status === "completed" || job.status === "success")
);

/**
 * Initialize the job store with initial data
 * This should be called after the service container is initialized
 */
export async function initializeJobStore() {
   try {
      if (!serviceContainer.isInitialized()) {
         console.warn(
            "[JobStore] Service container not initialized yet, skipping job store initialization"
         );
         return;
      }

      await jobStore.initialize();
   } catch (error) {
      console.error("[JobStore] Failed to initialize job store:", error);
   }
}
