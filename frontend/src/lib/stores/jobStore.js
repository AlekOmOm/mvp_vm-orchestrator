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
import { createStoreFactory } from "./storeFactoryTemplate.js";

// ❌ REMOVED: Direct logStore import - will be injected as dependency if needed
async function fetchAndStoreLogs(jobService, jobId) {
   try {
      const data = await jobService.fetchJobLogs(jobId);
      // TODO: If log integration needed, inject logStore as dependency
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

               baseStore.setState({
                  jobs,
                  stats,
                  lastFetch: now,
               });

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

            baseStore.update((state) => ({
               ...state,
               jobsByVM: { ...state.jobsByVM, [vmId]: jobs },
            }));

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
         // logStore.setCurrentJob(job); // logStore is not defined in this file
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
         baseStore.update((state) => {
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
         });
         // logStore.setCurrentJob(job); // logStore is not defined in this file
      },

      /**
       * Update job status
       * @param {string} jobId - Job ID
       * @param {Object} updates - Job updates
       */
      updateJob(jobId, updates) {
         baseStore.update((state) => ({
            ...state,
            jobs: state.jobs.map((job) =>
               job.id === jobId ? { ...job, ...updates } : job
            ),
            currentJob:
               state.currentJob?.id === jobId
                  ? { ...state.currentJob, ...updates }
                  : state.currentJob,
         }));
         // logStore.setCurrentJob(null); // logStore is not defined in this file
      },

      /**
       * Remove job from history
       * @param {string} jobId - Job ID
       */
      removeJob(jobId) {
         baseStore.update((state) => ({
            ...state,
            jobs: state.jobs.filter((job) => job.id !== jobId),
            currentJob:
               state.currentJob?.id === jobId ? null : state.currentJob,
         }));
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

// Legacy singleton instance for backward compatibility (will be removed after full migration)
export const jobStore = createJobStore();

const initialStateFactory = {
   jobs: [],
   jobsByVM: {},
   currentJob: null,
   loading: false,
   error: null,
   lastFetch: null,
   cacheTimeout: 5 * 60 * 1000,
   stats: { total: 0, running: 0, success: 0, failed: 0 },
};

function jobStoreLogic(baseStore, dependencies) {
   const { jobService } = dependencies;

   const calculateJobStats = (jobs) => {
      const total = jobs.length;
      const running = jobs.filter((j) => j.status === "running").length;
      const success = jobs.filter(
         (j) => j.status === "completed" || j.status === "success"
      ).length;
      const failed = jobs.filter((j) => j.status === "failed").length;
      return {
         total,
         running,
         success,
         failed,
         successRate: total > 0 ? ((success / total) * 100).toFixed(1) : 0,
      };
   };

   async function fetchAndStore(jobId) {
      try {
         const data = await jobService.fetchJobLogs(jobId);
         // logStore.addLogLines(jobId, data); // logStore is not defined in this file
      } catch (_) {}
   }

   return {
      async loadJobs(forceRefresh = false) {
         return withLoadingState(baseStore, async () => {
            const current = baseStore.getValue();
            const now = Date.now();
            if (
               !forceRefresh &&
               current.jobs.length &&
               current.lastFetch &&
               now - current.lastFetch < current.cacheTimeout
            )
               return current.jobs;
            const fetched = await jobService.fetchJobs();
            const merged = new Map();
            fetched.forEach((j) => merged.set(j.id, j));
            current.jobs.forEach((j) => {
               const f = merged.get(j.id);
               if (!f) merged.set(j.id, j);
               else {
                  const currFinished = j.finished_at || j.finishedAt;
                  const fetchedFinished = f.finished_at || f.finishedAt;
                  if (currFinished && !fetchedFinished)
                     merged.set(j.id, { ...f, ...j });
                  else if (j.status !== "running" && f.status === "running")
                     merged.set(j.id, { ...f, ...j });
                  else merged.set(j.id, { ...j, ...f });
               }
            });
            const jobs = Array.from(merged.values()).sort(
               (a, b) =>
                  new Date(b.started_at || b.createdAt || 0) -
                  new Date(a.started_at || a.createdAt || 0)
            );
            const stats = calculateJobStats(jobs);
            baseStore.setState({ jobs, stats, lastFetch: now });
            return jobs;
         });
      },
      async refreshJobs() {
         return this.loadJobs(true);
      },
      invalidateCache() {
         baseStore.setState({ jobs: [], jobsByVM: {}, lastFetch: null });
      },
      getJobsForVM(vmId) {
         const state = baseStore.getValue();
         return state.jobsByVM[vmId] || [];
      },
      getJobById(jobId) {
         const state = baseStore.getValue();
         return state.jobs.find((j) => j.id === jobId) || null;
      },
      addJob(job) {
         baseStore.update((s) => {
            const updated = [job, ...s.jobs].slice(0, 100);
            const vmJobs = s.jobsByVM[job.vmId] || [];
            return {
               ...s,
               jobs: updated,
               jobsByVM: {
                  ...s.jobsByVM,
                  [job.vmId]: [job, ...vmJobs].slice(0, 100),
               },
            };
         });
         // logStore.setCurrentJob(job); // logStore is not defined in this file
      },
      updateJob(jobId, updates) {
         baseStore.update((s) => ({
            ...s,
            jobs: s.jobs.map((j) =>
               j.id === jobId ? { ...j, ...updates } : j
            ),
            currentJob:
               s.currentJob?.id === jobId
                  ? { ...s.currentJob, ...updates }
                  : s.currentJob,
         }));
      },
      removeJob(jobId) {
         baseStore.update((s) => ({
            ...s,
            jobs: s.jobs.filter((j) => j.id !== jobId),
            currentJob: s.currentJob?.id === jobId ? null : s.currentJob,
         }));
      },
      clearJobs() {
         baseStore.setState({ jobs: [], jobsByVM: {}, currentJob: null });
      },
      async loadVMJobs(vmId, options = {}, withLogLines = false) {
         return withLoadingState(baseStore, async () => {
            const fetched = await jobService.fetchVMJobs(vmId, options);
            const globalJobs = baseStore
               .getValue()
               .jobs.filter((j) => j.vmId === vmId);
            const existing = baseStore.getValue().jobsByVM[vmId] || [];
            const merged = new Map();
            [...fetched, ...globalJobs, ...existing].forEach((j) =>
               merged.set(j.id, { ...merged.get(j.id), ...j })
            );
            const jobs = Array.from(merged.values()).sort(
               (a, b) =>
                  new Date(b.started_at || b.createdAt || 0) -
                  new Date(a.started_at || a.createdAt || 0)
            );
            baseStore.update((state) => ({
               ...state,
               jobsByVM: { ...state.jobsByVM, [vmId]: jobs },
            }));
            if (withLogLines) {
               for (const j of jobs) await fetchAndStore(j.id);
            }
            return jobs;
         });
      },
   };
}

export const createJobStoreFactory = createStoreFactory(
   "JobStore",
   initialStateFactory,
   jobStoreLogic
);
