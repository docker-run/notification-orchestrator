import express from 'express';
import { NotificationCoordinator } from '../coordinator/NotificationCoordinator';
import { wrapAsyncHandler } from '../utils';

export function eventRoute(coordinator: NotificationCoordinator) {
  const router = express.Router();

  router.post('/', wrapAsyncHandler(async (req, res) => {
    const result = await coordinator.processEvent(req.body);
    if (result?.decision === 'PROCESS_NOTIFICATION') {
      res.status(202).json(result);
    } else {
      res.status(200).json(result);
    }
  }));

  return router;
}
