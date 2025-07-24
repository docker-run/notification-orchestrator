import express from 'express';
import { eventRoute } from './routes/event';
import { userRoute } from './routes/user';
import { NotificationCoordinator } from './coordinator/NotificationCoordinator';
import { NotificationPreferencesRepository } from './repositories/NotificationPreferencesRepository';
import { setupDynamoTables } from './config/dynamo';
import { errorHandlerMiddleware } from './error-handler-middleware';

export async function createApp() {
  const app = express();

  const repository = new NotificationPreferencesRepository();
  const coordinator = new NotificationCoordinator(repository);

  setupDynamoTables().then(() => {
    console.log('DynamoDB tables initialized');
  }).catch(console.error);

  app.use(express.json());
  app.use('/event', eventRoute(coordinator));
  app.use('/user', userRoute(repository));

  app.use(errorHandlerMiddleware);

  return { app }
}


