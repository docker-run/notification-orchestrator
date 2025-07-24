import { createApp } from './app';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  const { app } = await createApp();

  const server = app.listen(PORT, () => {
    console.log(`Server ready { port=${PORT} }`);
  });

  const shutdown = () => {
    console.info('Shutting down server...');

    server.close(() => {
      console.info('Server has been stopped');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return server
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
