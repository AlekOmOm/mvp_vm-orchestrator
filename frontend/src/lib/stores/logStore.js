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

function createLogStore() {
   const base = createBaseStore({ linesByJob: {} }, { name: "LogStore" });

   function addLogLine(jobId, line) {
      base.updateWithLoading((state) => {
         return {
            ...state,
            linesByJob: {
               ...state.linesByJob,
               [jobId]: [{ ...line, jobId }], // Only keep latest line
            },
         };
      });
   }

   function getLogLinesForJob(jobId) {
      return base.getValue().linesByJob[jobId] || [];
   }

   function getLogLineCount() {
      return Object.values(base.getValue().linesByJob).reduce(
         (acc, lines) => acc + lines.length,
         0
      );
   }

   return {
      ...base,
      addLogLine,
      getLogLinesForJob,
      getLogLineCount,
   };
}

export const logStore = createLogStore();
