/**
 * Job Store - Direct instance implementation
 */

import { createCRUDStore } from "./crudStore.js";
import { getService } from "$lib/core/ServiceContainer.js";

const initialState = {
   jobs: [],
   jobsByVM: {},
   currentJob: null,
   loading: false,
   error: null,
};

// Get jobService from ServiceContainer
const jobService = getService("jobService");
const store = createCRUDStore(initialState);

// Proxy log lines store from JobWebSocketService via JobService
const logLinesStore = jobService.getLogLines();

export const jobStore = {
   ...store,
   // realtime log stream (Svelte store)
   logLines: logLinesStore,

   async loadJobs() {
      store.update((state) => ({ ...state, loading: true, error: null }));

      try {
         const jobs = await jobService.fetchJobs();
         store.update((state) => ({ ...state, jobs, loading: false }));
         return jobs;
      } catch (error) {
         console.error("Failed to load jobs:", error);
         store.update((state) => ({
            ...state,
            loading: false,
            error: error.message,
         }));
         throw error;
      }
   },

   async loadVMJobs(vmId) {
      if (!vmId) return [];

      try {
         const jobs = await jobService.fetchVMJobs(vmId);
         store.update((state) => ({
            ...state,
            jobsByVM: { ...state.jobsByVM, [vmId]: jobs },
         }));
         return jobs;
      } catch (error) {
         console.error(`Failed to load jobs for VM ${vmId}:`, error);
         throw error;
      }
   },

   addJob(job) {
      store.update((state) => ({
         ...state,
         jobs: [job, ...state.jobs],
      }));
   },

   updateJob(jobId, updates) {
      store.update((state) => ({
         ...state,
         jobs: state.jobs.map((j) =>
            j.id === jobId ? { ...j, ...updates } : j
         ),
      }));
   },

   setCurrentJob(job) {
      store.update((state) => ({ ...state, currentJob: job }));
   },

   setJobs(jobs) {
      store.update((state) => ({ ...state, jobs }));
   },

   getCurrentJob() {
      return store.getState().currentJob;
   },

   getVMJobs(vmId) {
      return store.getState().jobsByVM[vmId] || [];
   },

   getLogLinesForJob(jobId) {
      const job = store.getState().jobs.find((j) => j.id === jobId);
      return job?.logs || [];
   },
};

export function createJobStore() {
   return jobStore;
}
