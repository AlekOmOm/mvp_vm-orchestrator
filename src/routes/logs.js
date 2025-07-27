import { LogModel } from '../lib/models/LogModel.js';

export function createLogsRouter(db) {
    const router = express.Router();
    const logModel = new LogModel(db);


    router.get('/:jobId', async (req, res) => {
        const logs = await logModel.getLogsForJob(req.params.jobId);
        res.json(logs);
    });

    router.get('/', async (req, res) => {
        const logs = await logModel.getLogs(req?.query?.limit);
        res.json(logs);
    });

   return router;
}