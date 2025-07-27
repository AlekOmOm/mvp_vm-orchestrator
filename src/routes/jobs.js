import express from 'express';
import { JobModel } from '../lib/models/JobModel.js';
import { serverlessAPI } from '../lib/serverless-api-client.js';

export function createJobsRouter(db) {
  const router = express.Router();
  const jobModel = new JobModel(db);


  router.get('/', async (req, res) => {
    try {
      const jobs = await jobModel.getJobs(req?.query?.limit);
      res.json(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Failed to fetch job history' });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const job = await jobModel.createJob(req.body);
      res.status(201).json(job);
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(500).json({ error: 'Failed to create job' });
    }
  });


  router.get('/:jobId', async (req, res) => {
    try {
      const job = await jobModel.getJob(req.params.jobId);
      res.json(job);
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({ error: 'Failed to fetch job' });
    }
  });

  router.put('/:jobId', async (req, res) => {
    try {
      const job = await jobModel.updateJob(req.params.jobId, req.body);
      res.json(job);
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({ error: 'Failed to update job' });
    }
  });

  router.get('/:jobId/logs', async (req, res) => {
    try {
      const lines = await jobModel.getJobLogs(req.params.jobId, req.query.limit);
      res.json(lines);
    } catch (error) {
      console.error('Error fetching job logs:', error);
      res.status(500).json({ error: 'Failed to fetch job logs' });
    }
  });

  return router;
}
//ApiClient.js:136  GET http://localhost:5176/api/jobs?limit=10 404 (Not Found)