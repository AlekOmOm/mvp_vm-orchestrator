/**
 * Job Store - Minimal implementation
 */

import { createCRUDStore } from "./crudStore.js";

const initialState = {
   jobs: [],
   jobsByVM: {},
   currentJob: null,
};

function createJobStore(dependencies) {
   const { jobService } = dependencies;
   const store = createCRUDStore(initialState, jobService);

   return {
      ...store,

      async loadJobs() {
         const jobs = await jobService.fetchJobs();
         store.update(state => ({ ...state, jobs }));
         return jobs;
      },

      async loadVMJobs(vmId) {
         const jobs = await jobService.fetchVMJobs(vmId);
         store.update(state => ({
            ...state,
            jobsByVM: { ...state.jobsByVM, [vmId]: jobs }
         }));
         return jobs;
      },

      addJob(job) {
         store.update(state => ({
            ...state,
            jobs: [job, ...state.jobs]
         }));
      },

      updateJob(jobId, updates) {
         store.update(state => ({
            ...state,
            jobs: state.jobs.map(j => j.id === jobId ? { ...j, ...updates } : j)
         }));
      }
   };
}

export const createJobStoreFactory = () => createJobStore;
