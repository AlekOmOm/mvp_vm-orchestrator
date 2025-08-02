/**
 * Log Store - Direct instance implementation
 *
 * - used in JobLogModal.svelte
 *
 * flow
 * - when job is executed, the job is added to the store, then the log lines should be added to this store
 * -> thus integrated in JobService
 */

import { getService } from "$lib/core/ServiceContainer.js";
import { createCRUDStore } from "./crudStore.js";

const initialState = {
   logs: null,
   loading: false,
   error: null,
};

// Get logService from ServiceContainer
const logService = getService("logService");
const store = createCRUDStore(initialState);

const logStore = {
   ...store,

   async loadLogs(jobId) {
      store.update((state) => ({ ...state, loading: true, error: null }));

      try {
         const logs = await logService.fetchLogsForJob(jobId);
         store.update((state) => ({
            ...state,
            logs,
            loading: false,
            error: null,
         }));
         console.log("Logs loaded:", logs.length);
         return logs;
      } catch (error) {
         console.error("Failed to load logs:", error);
         store.update((state) => ({
            ...state,
            loading: false,
            error: error.message,
         }));
         throw error;
      }
   },

   getLogs() {
      return store.getState().logs;
   },

   getLogLinesForJob(jobId) {
      return store.getState().logs;
   },
};

export function createLogStore() {
   return logStore;
}
