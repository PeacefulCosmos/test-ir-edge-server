import amqp, { Channel, Connection } from 'amqplib';
import URL from 'url-parse';
import { SysAPI } from '@inreality/desktop-player-lib';
import { configService } from '@app/config/config.service';
import { OverloadType } from './rabbitmq.model';
import { deviceService } from '@api/device';
import { templateService } from '@api/template';
import { clearInterval } from 'timers';

class RabbitMQService {
  connection: Connection = null;
  channel: Channel = null;
  cachedMacAddr: string = null;
  amqpConfig = configService.current.amqp;
  heartbeatInterval: NodeJS.Timer = null;

  async init(): Promise<void> {
    let targetUrl = '';
    this.cachedMacAddr = await SysAPI.current().getMACAddress();
    const urlObj = new URL(this.amqpConfig.url);
    if (urlObj.port === '') {
      urlObj.set(
        'port',
        this.amqpConfig.url.startsWith('amqps') ? '5671' : '5672'
      );
    }
    targetUrl = urlObj.toString();
    if (targetUrl.endsWith('/')) {
      targetUrl = targetUrl.substring(0, targetUrl.length - 1);
    }

    try {
      this.connection = await amqp.connect(`${targetUrl}/p2pvh`);
      console.log(`Service Connected to ${targetUrl}`);
      this.connection.on('close', async () => {
        console.log(
          '[RabbitMQ Service]',
          `Connection closed ${targetUrl} 5 second later reconnect...`
        );
        await this.wait(5000);
        this.init();
      });
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue('server', {
        durable: false,
      });
      await this.channel.assertExchange('templates', 'fanout', {
        durable: false,
      });
      this.heartbeatInterval = setInterval(() => {
        this.broadcast('HEARTBEAT');
      }, 10000);
      this.broadcast('HEARTBEAT');
      console.log('Start Heartbeat broadcasting');
    } catch (err) {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }
      if (this.channel) {
        await this.channel.close();
      }
      if (!this.connection) {
        console.log(
          `[RabbitMQ Service]', "${err}", "${targetUrl}", '5 second later reconnect...`
        );
        await this.wait(5000);
        this.init();
      } else {
        console.log('[RabbitMQ Service]', `${err}`);
        await this.connection.close();
      }
    }
  }

  handleMessage(content: any) {
    if (Object.prototype.hasOwnProperty.call(content, 'type')) {
      if (
        content.mac !== this.cachedMacAddr ||
        (content.mac === this.cachedMacAddr && content.device !== 'ES')
      ) {
        console.log(content);
        switch (content.type) {
          case 'HEARTBEAT':
            deviceService.addOnlineMac(content.mac);
            console.log('HEARTBEAT');
            break;
          case 'TEMPLATE':
            if (content.body instanceof String) {
              console.log('Invalid TEMPLATE body');
            } else {
              templateService.createTemplate(content.body);
              this.broadcastRaw(content);
            }
            break;
          case 'REQUEST_TEMPLATE':
            templateService.requestTemplate(String(content.body));
            break;
          default:
            console.log(`Unknown type: ${content.type}`);
        }
      }
    }
  }

  broadcast(type: string, body: any = undefined) {
    const overload: OverloadType = {
      type: type,
      device: 'ES',
      mac: this.cachedMacAddr,
      body: body,
    };
    return this.broadcastRaw(overload);
  }

  broadcastRaw(data: OverloadType) {
    try {
      return this.channel.publish(
        'templates',
        '',
        Buffer.from(JSON.stringify(data))
      );
    } catch (error) {
      console.error(error);
    }
  }

  wait(ms: number) {
    return new Promise<void>((rs, rj) => {
      setTimeout(rs, ms);
    });
  }
}

export const rabbitMQService = new RabbitMQService();
