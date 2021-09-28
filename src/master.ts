import { AppAPI, SysAPI } from '@inreality/desktop-player-lib';
import { configService } from './config/config.service';
import { rabbitMQService } from '@comp/rabbitmq/rabbitmq.service';
import { socketIOService } from './components/socket/socketIO.service';
import { tlsSocketService } from './components/socket/tls.socket';
import { templateService } from './api/template';
import { ivhRabbittmqService } from './components/ivh-rmq/ivh-rmq.service';
import { loggingService } from './components/logging/logging.service';

export const init = async () => {
  try {
    await AppAPI.initWithExecutableDir(__dirname, {
      installDir: __dirname,
    });
    await configService.init();
    const amqpConfig = configService.current.amqp;
    initServer();
  } catch (err) {
    console.error(err);
  }
};

const initServer = async () => {
  //connect intellisense
  await tlsSocketService.connect();

  await loggingService.init();
  // await rabbitMQService.init();
};
