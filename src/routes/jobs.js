import express from 'express';
import { JobModel } from '../lib/models/JobModel.js';
import { serverlessAPI } from '../lib/serverless-api-client.js';

export function createLogsRouter(db) {
  const router = express.Router();
  const jobModel = new JobModel(db);

  router.get('/jobs', async (req, res) => {
    try {
      const jobs = await jobModel.getJobs(req.query.limit);
      res.json(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Failed to fetch job history' });
    }
  });

  router.get('/jobs/:jobId/logs', async (req, res) => {
    try {
      const lines = await jobModel.getJobLogs(req.params.jobId, req.query.limit);
      res.json(lines);
    } catch (error) {
      console.error('Error fetching job logs:', error);
      res.status(500).json({ error: 'Failed to fetch job logs' });
    }
  });

  router.get('/vms/:vmId/jobs', async (req, res) => {
    try {
      const jobs = await serverlessAPI.getVMJobs(req.params.vmId, req.query);
      res.json(jobs);
    } catch (error) {
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  });

  return router;
}
