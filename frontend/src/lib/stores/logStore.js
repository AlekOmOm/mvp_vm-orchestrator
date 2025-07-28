/**
 * store for log lines of jobs
 *
 * - used in JobLogModal.svelte
 *
 * flow
 * - when job is executed, the job is added to the store, then the log lines should be added to this store
 * -> thus integrated in JobService
 */

import { createBaseStore } from "./baseStore.js";
import { createStoreFactory } from "./storeFactoryTemplate.js";

const initialStateLog = { linesByJob: {} };

function logStoreLogic(baseStore, _deps) {
   function addLogLine(jobId, line) {
      if (!jobId || !line) return;
      baseStore.update((state) => {
         const lines = state.linesByJob[jobId] || [];
         return {
            ...state,
            linesByJob: {
               ...state.linesByJob,
               [jobId]: [...lines, { ...line, jobId }],
            },
         };
      });
   }
   function setLogsForJob(jobId, logs) {
      baseStore.update((s) => ({
         ...s,
         linesByJob: { ...s.linesByJob, [jobId]: logs },
      }));
   }
   function getLogLinesForJob(jobId) {}
   return { ...baseStore, addLogLine, getLogLinesForJob, setLogsForJob };
}

export const createLogStoreFactory = createStoreFactory(
   "LogStore",
   initialStateLog,
   logStoreLogic
);

// ❌ REMOVED: Singleton store export - use factory pattern via StoresContainer instead
// Components should access stores via: await storesContainer.get('logStore')
