import express from 'express';
import { NotificationPreferencesRepository } from '../repositories/NotificationPreferencesRepository';
import { wrapAsyncHandler } from '../utils';

export function userRoute(repository: NotificationPreferencesRepository) {
  const router = express.Router();

  router.get('/:userId/preferences', wrapAsyncHandler(async (req, res) => {
    const result = await repository.getUserPreferences(req.params.userId);
    res.json(result);
  }))

  router.post('/:userId/preferences', wrapAsyncHandler(async (req, res) => {
    await repository.setUserPreferences(req.params.userId, req.body);
    res.status(201).json({ message: "Preferences set successfully" });
  }))

  router.put('/:userId/preferences', wrapAsyncHandler(async (req, res) => {
    await repository.updateUserPreferences(req.params.userId, req.body);
    res.status(200).json({ message: "Preference updated" });
  }))

  router.post('/:userId/dnd-windows', wrapAsyncHandler(async (req, res) => {
    const windowId = await repository.addDNDWindow(req.params.userId, req.body);
    res.status(201).json({ windowId, message: 'DND window added successfully' });
  }))

  router.get('/:userId/dnd-windows', wrapAsyncHandler(async (req, res) => {
    const windows = await repository.getDNDWindows(req.params.userId);
    res.json(windows);
  }))

  router.delete('/:userId/dnd-windows/:windowId', wrapAsyncHandler(async (req, res) => {
    await repository.removeDNDWindow(req.params.userId, req.params.windowId);
    res.json({ message: 'DND window removed successfully' });
  }))

  return router;
}
