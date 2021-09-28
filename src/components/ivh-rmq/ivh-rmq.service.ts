import { SysAPI } from '@inreality/desktop-player-lib';
import { configService } from '@app/config/config.service';
import URL from 'url-parse';
import amqp from 'amqplib';
import moment from 'moment';
import { deviceService } from '@app/api/device';
import { templateService } from '@app/api/template';
import { PersonTemplateType } from '@app/api/person/person.schema';
import { BroadcastMessage, enrollFaceDocType } from './ivh-rmq.schema';
import { personService } from '@app/api/person';

class IVHRabbittmqService {
  connection: amqp.Connection = null;
  channel: amqp.Channel = null;
  cachedMacAddr: string = null;
  exchangeKey = '';
  routingKey = '';
  packageName = 'com.inreality.ptp-socket-server';

  async init() {
    let targetUrl = '';
    try {
      const amqpURL: string = configService.current.amqp.url;
      this.cachedMacAddr = await SysAPI.current().getMACAddress();
      const urlObj = new URL(amqpURL);
      if (urlObj.port === '') {
        urlObj.set('port', amqpURL.startsWith('amqps') ? '5671' : '5672');
      }
      targetUrl = urlObj.toString();
      if (targetUrl.endsWith('/')) {
        targetUrl = targetUrl.substring(0, targetUrl.length - 1);
      }
      this.connection = await amqp.connect(`${targetUrl}/ivh`);
      console.log(`[IVH RabbitMQ Service] Service Connected to ${targetUrl}`);
      this.connection.on('close', async () => {
        console.log(
          '[IVH RabbitMQ Service]',
          `Connection closed ${targetUrl} 5 second later reconnect...`
        );
        await this.wait(5000);
        await this.init();
      });

      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchangeKey, 'fanout', {
        durable: false,
      });
      console.log('[IVH RabbitMQ Service]', 'Requesting...');
      return;
    } catch (err) {
      if (this.channel !== null) {
        this.channel.close();
        return;
      }
      if (this.connection === null) {
        console.log(
          '[IVH RabbitMQ Service]',
          `${err}`,
          `${targetUrl}`,
          '5 second later reconnect...'
        );
        await this.wait(5000);
        await this.init();
      } else {
        console.log('[IVH RabbitMQ Service]', `${err}`);
        this.connection.close();
        return;
      }
    }
  }

  async handleMessage(content: any) {
    const mac = content['MAC'];
    const dest = content['DESTINATION_PKG_NAME'];
    const action = content['ACTION'];
    const uuid = content['TRANSACTION_ID'];
    const params = content['DATA'];

    if (mac !== this.cachedMacAddr && action === 'heartbeat') {
      deviceService.addOnlineMac(mac);
    } else {
      if (mac === this.cachedMacAddr && dest === this.packageName) {
        switch (action) {
          case 'generate_template': {
            const doc = {
              uuid: uuid,
              template: params.template,
              error: params.error,
            };
            return doc;
          }
          case 'cloud_enroll_face': {
            const id = params.id;
            const name = params.name;
            const type = params.type;
            const faceData = params.image;
            await this.enrollFace(uuid, { id, name, type, faceData });
            return null;
          }
          default: {
            return null;
          }
        }
      }
    }
  }

  async generateTemplate(
    uuid: string,
    faceData: string,
    cb: (err: any, data: { uuid: string; template: string; error: any }) => void
  ) {
    const q = await this.channel.assertQueue('', { autoDelete: true });
    await this.channel.bindQueue(q.queue, this.exchangeKey, '');

    await this.channel.consume(
      q.queue,
      async (msg) => {
        const content = JSON.parse(msg.content.toString());
        if (content['TRANSACTION_ID'] === uuid) {
          const result = await this.handleMessage(content);
          if (result) {
            await this.channel.cancel(msg.fields.consumerTag);
            cb(result.error, result);
          }
        }
      },
      { noAck: true }
    );

    const dest = 'com.inreality.python-ava';
    const action = 'generate_template';
    const params = { image: faceData };
    const message = {
      MAC: this.cachedMacAddr,
      SOURCE_PKG_NAME: this.packageName,
      DESTINATION_PKG_NAME: dest,
      TRANSACTION_ID: uuid,
      TIMESTAMP: moment().format('YYYYMMDDHHmmssSSS'),
      ACTION: action,
      DATA: params,
    };

    this.broadcast(message);
  }

  async enrollFace(uuid: string, doc: enrollFaceDocType) {
    const dest = 'com.inreality.dms-client-node';
    const action = 'cloud_enroll_face';
    const { id, name, type, faceData } = doc;
    if (id) {
      try {
        const personRecord: PersonTemplateType = await templateService.enroll({
          id,
          faceData,
        });
        const params = {
          _id: personRecord._id,
          name: personRecord.name,
          type: personRecord.type,
          template: personRecord.template,
        };
        const message = {
          MAC: this.cachedMacAddr,
          SOURCE_PKG_NAME: this.packageName,
          DESTINATION_PKG_NAME: dest,
          TRANSACTION_ID: uuid,
          TIMESTAMP: moment().format('YYYYMMDDHHmmssSSS'),
          ACTION: action,
          DATA: params,
        };
        this.broadcast(message);
      } catch (error) {
        console.log(error);
        const params = {
          error: error,
        };
        const message = {
          MAC: this.cachedMacAddr,
          SOURCE_PKG_NAME: this.packageName,
          DESTINATION_PKG_NAME: dest,
          TRANSACTION_ID: uuid,
          TIMESTAMP: moment().format('YYYYMMDDHHmmssSSS'),
          ACTION: action,
          DATA: params,
        };
        this.broadcast(message);
      }
    } else {
      try {
        const person: PersonTemplateType = await personService.create({
          name,
          type,
          uuid,
        });
        const personRecord: PersonTemplateType = await templateService.enroll({
          id: person._id,
          faceData,
        });
        const params = {
          _id: personRecord._id,
          name: personRecord.name,
          type: personRecord.type,
          template: personRecord.template,
        };
        const message = {
          MAC: this.cachedMacAddr,
          SOURCE_PKG_NAME: this.packageName,
          DESTINATION_PKG_NAME: dest,
          TRANSACTION_ID: uuid,
          TIMESTAMP: moment().format('YYYYMMDDHHmmssSSS'),
          ACTION: action,
          DATA: params,
        };
        this.broadcast(message);
      } catch (err) {
        console.log(err);
        const params = {
          error: err,
        };
        const message = {
          MAC: this.cachedMacAddr,
          SOURCE_PKG_NAME: this.packageName,
          DESTINATION_PKG_NAME: dest,
          TRANSACTION_ID: uuid,
          TIMESTAMP: moment().format('YYYYMMDDHHmmssSSS'),
          ACTION: action,
          DATA: params,
        };
        this.broadcast(message);
      }
    }
  }

  broadcast(body: BroadcastMessage) {
    console.log('[IVH RabbitMQ Service]', 'Sending...');
    try {
      this.channel.publish(
        this.exchangeKey,
        this.routingKey,
        Buffer.from(JSON.stringify(body))
      );
    } catch (err) {
      console.log(err);
    }
  }

  async wait(ms: number) {
    return new Promise<void>((res, rej) => {
      setTimeout(() => {
        res();
      }, ms);
    });
  }
}

export const ivhRabbittmqService = new IVHRabbittmqService();
