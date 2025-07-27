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
    const base = createBaseStore({ linesByJob: {} }, { name: "LogStore", enableLogging: true });

    function addLogLine(jobId, line) {
        if (!jobId || !line) return;
        base.update(state => {
            const lines = state.linesByJob[jobId] || [];
            const updatedLines = [...lines, { ...line, jobId }];
            return {
                ...state,
                linesByJob: {
                    ...state.linesByJob,
                    [jobId]: updatedLines,
                },
            };
        });
    }

    function setLogsForJob(jobId, logs) {
        base.update(state => ({
            ...state,
            linesByJob: {
                ...state.linesByJob,
                [jobId]: logs,
            }
        }));
    }

    function getLogLinesForJob(jobId) {
        return base.getValue().linesByJob[jobId] || [];
    }
    
    return {
        ...base,
        addLogLine,
        getLogLinesForJob,
        setLogsForJob,
    };
}

export const logStore = createLogStore();
