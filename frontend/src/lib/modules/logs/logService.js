/**
 * Log Service
 * 
 * This service WS / api for logs
 */

import { serviceContainer } from '../../core/ServiceContainer.js';

export class LogService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    async fetchLogsForJob(jobId) {
        if (!jobId) {
            return [];
        }
        try {
            const logs = await this.apiClient.get(`/api/jobs/${jobId}/logs`);
            return (logs || []).map(l => ({
                stream: l.stream,
                data: l.chunk,
                timestamp: l.timestamp
            }));
        } catch (error) {
            console.error(`Failed to fetch logs for job ${jobId}`, error);
            return [];
        }
    }
}