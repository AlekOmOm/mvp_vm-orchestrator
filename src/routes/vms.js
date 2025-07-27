import express from 'express';
import { serverlessAPI } from '../lib/serverless-api-client.js';
import { SSHManager } from '../lib/ssh-manager.js';

export function createVmsRouter(executionManager) {
  const router = express.Router();

  // ====== VM CRUD via serverless ======
  router.get('/', async (req, res) => {
    try {
      const vms = await serverlessAPI.getVMs();
      res.json(vms);
    } catch (error) {
      console.error('Error fetching VMs:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const vm = await serverlessAPI.createVM(req.body);
      res.status(201).json(vm);
    } catch (error) {
      console.error('Error creating VM:', error);
      const status = error.message.includes('already exists') ? 409 : 500;
      res.status(status).json({ error: error.message });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const vm = await serverlessAPI.getVM(req.params.id);
      res.json(vm);
    } catch (error) {
      console.error('Error fetching VM:', error);
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const vm = await serverlessAPI.updateVM(req.params.id, req.body);
      res.json(vm);
    } catch (error) {
      console.error('Error updating VM:', error);
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await serverlessAPI.deleteVM(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting VM:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ====== Commands CRUD via serverless ======
  router.get('/:vmId/commands', async (req, res) => {
    try {
      const commands = await serverlessAPI.getVMCommands(req.params.vmId);
      res.json(commands);
    } catch (error) {
      console.error('Error fetching VM commands:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:vmId/commands', async (req, res) => {
    try {
      const command = await serverlessAPI.createCommand(req.params.vmId, req.body);
      res.status(201).json(command);
    } catch (error) {
      console.error('Error creating command:', error);
      const status = error.message.includes('already exists') ? 409 : error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  });

  // ====== VM Jobs via serverless ======
  router.get('/:vmId/jobs', async (req, res) => {
    try {
      const jobs = await serverlessAPI.getVMJobs(req.params.vmId, req.query);
      res.json(jobs);
    } catch (error) {
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  });

  // ====== SSH operations ======
  router.get('/:hostAlias/test', async (req, res) => {
    try {
      const { hostAlias } = req.params;
      if (!hostAlias) return res.status(400).json({ error: 'Host alias is required' });

      const result = await SSHManager.testConnection(hostAlias);
      res.json(result);
    } catch (error) {
      console.error(`Error testing connection to ${req.params.hostAlias}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:hostAlias/execute', async (req, res) => {
    try {
      const { hostAlias } = req.params;
      const { command } = req.body;
      if (!hostAlias) return res.status(400).json({ error: 'Host alias is required' });
      if (!command || typeof command !== 'string') return res.status(400).json({ error: 'Command is required and must be a string' });

      const result = await executionManager.executeWithStrategy(command, 'ssh', null, hostAlias);
      res.json({ jobId: result.jobId, type: 'ssh' });
    } catch (error) {
      console.error(`Error executing command on ${req.params.hostAlias}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
