import { createApp } from './app';
import { config } from './config';
import { logger } from './logger';

const app = createApp();

app.listen(config.port, () => {
  logger.info({ port: config.port }, 'Backend listening');
});













