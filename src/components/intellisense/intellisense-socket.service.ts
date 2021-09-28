import { deviceService, DeviceType } from '@app/api/device';
import { personService } from '@app/api/person';
import { PersonTemplateType } from '@app/api/person/person.schema';
import { templateService } from '@app/api/template';
import { configService } from '@app/config/config.service';
import { SysAPI } from '@inreality/desktop-player-lib';
import { Callback, CallbackError } from 'mongoose';
import socketIO, { Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io-client/build/typed-events';

class IntellisenseSocketService {
  socket: Socket<DefaultEventsMap, DefaultEventsMap> = null;

  async init(): Promise<void> {
    const { cloud: cloudSettings } = configService.current.intellisense;
    if (!cloudSettings.enable) {
      console.log('IntelliSense Cloud socket server service disabled');
      return;
    }
    console.log(`Try connect to socket server [${cloudSettings.url}]`);
    const mac = await SysAPI.current().getMACAddress();
    const opts = {
      path: '#{cloudSettings.context}/socket.io',
      extraHeaders: {
        'x-device-type': 'edgeserver',
        'x-device-mac': mac,
      },
    };
    console.log(`${cloudSettings.url}/${cloudSettings.context}`);
    this.socket = socketIO(`${cloudSettings.url}`, opts);
    this.initListener();
    console.log('IntelliSense Socket init');
  }

  async initListener() {
    this.socket.on('connect', () => {
      console.log('Connected to IntelliSense Cloud socket server');
    });

    this.socket.on('error', (err) => {
      console.error('Error: ', err);
    });

    this.socket.on('reconnect_error', (err) => {
      console.error('Reconnect error: ', err);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnect from IntelliSense Cloud socket server');
    });

    //events
    this.socket.on('device-connections', async (data, callback) => {
      console.log(`device-connections`);
      try {
        const devices: DeviceType[] = await deviceService.findAll();
        callback(null, devices);
      } catch (err) {
        callback(err);
      }
    });

    // callback events
    this.socket.on(
      'create person',
      async (data: PersonTemplateType, callback) => {
        let personObj: PersonTemplateType = null;
        const { name, type, template } = data;
        if (!template) {
          callback(new Error('Missing template'));
        }
        try {
          personObj = await personService.create({
            name,
            type,
          });
        } catch (err) {
          if (personObj) {
            try {
              await personService.delete(personObj._id);
              console.log('Delete person since not success');
            } catch (err) {
              console.error(err);
            }
          }
          console.error(`Fail to remote enroll, reason: ${err}`);
          callback(`Fail to remote enroll, reason: ${err}`);
        }
      }
    );

    this.socket.on(
      'update person',
      async (data: PersonTemplateType = {}, callback) => {
        const { name, type, template, _id } = data;

        if (!template) {
          return;
        } else {
          await templateService.enroll({ id: _id, faceData: template });
        }
        try {
          await personService.update(_id, { name, type });
          console.log(`Remote enroll success! Name: ${name} Type: ${type}`);
          callback(null, { name, type, _id });
        } catch (err) {
          console.error(`Fail to remote enroll, reason: ${err}`);
          callback(`Fail to remote enroll, reason: ${err}`);
        }
      }
    );

    this.socket.on('delete person', async (id, callback) => {
      try {
        await personService.delete(id);
        callback(null, 200);
      } catch (err) {
        console.error(`Fail to remote delete, reason: ${err}`);
        callback(`Fail to remote delete, reason: ${err}`);
      }
    });

    this.socket.on('list people', async (data, callback) => {
      try {
        const result = await personService.find({}, { template: false });
        callback(null, result);
      } catch (err) {
        callback(String(err));
      }
    });
  }

  async send(eventName: string, overload: any, requireCallback?: boolean) {
    let callback: Callback;
    if (!this.socket.connected) {
      return;
    }
    if (requireCallback) {
      callback = (err: CallbackError, message) => {
        if (err) {
          throw err;
        }
        return;
      };
    }

    this.socket.emit(eventName, overload, callback);
    if (!requireCallback) {
      return;
    }
  }
}

export const intellisenseSocketService = new IntellisenseSocketService();
