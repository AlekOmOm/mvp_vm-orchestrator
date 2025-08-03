import express from 'express';
import { serverlessAPI } from '../../clients/serverless-api-client.js';

export function createVmsRouter() {
  const router = express.Router();

  router.get('/', async (_, res) => {
    try {
      const vms = await serverlessAPI.getVMs();
      res.json(vms);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const vm = await serverlessAPI.getVM(req.params.id);
      res.json(vm);
    } catch (e) {
      res.status(e.message.includes('not found') ? 404 : 500).json({ error: e.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const vm = await serverlessAPI.createVM(req.body);
      res.status(201).json(vm);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const vm = await serverlessAPI.updateVM(req.params.id, req.body);
      res.json(vm);
    } catch (e) {
      res.status(e.message.includes('not found') ? 404 : 500).json({ error: e.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await serverlessAPI.deleteVM(req.params.id);
      res.status(204).send();
    } catch (e) {
      res.status(e.message.includes('not found') ? 404 : 500).json({ error: e.message });
    }
  });

  router.get('/:vmId/commands', async (req, res) => {
    try {
      const cmds = await serverlessAPI.getVMCommands(req.params.vmId);
      res.json(cmds);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/:vmId/commands', async (req, res) => {
    try {
      const cmd = await serverlessAPI.createCommand(req.params.vmId, req.body);
      res.status(201).json(cmd);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
