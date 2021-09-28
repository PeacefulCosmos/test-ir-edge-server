import { configService } from '@app/config/config.service';
import axios from 'axios';
import { intellisenseSocketService } from './intellisense-socket.service';

class IntellisenseService {
  async init() {
    const { cloud: cloudSettings } = configService.current.intellisense;
    if (!cloudSettings.enable) {
      console.log('IntelliSense Cloud server service disabled');
      return;
    }

    try {
      await this.ping();
      console.log(
        `IntelliSense Cloud server ${cloudSettings.url} is reachable`
      );
    } catch (err) {
      console.error(`Cannot connect to ${cloudSettings.url}`);
    }
  }

  async ping() {
    await axios.get(configService.current.intellisense.cloud.url);
  }

  async requestDeviceOffline(mac: string) {
    return await intellisenseSocketService.send('device-offline', { mac });
  }

  async requestDeviceOnline(mac: string) {
    return await intellisenseSocketService.send('device-online', { mac });
  }

  async convertAuthToHeader(username: string, password: string) {
    return await `Basic ${Buffer.from(`${username}:${password}`).toString(
      'base64'
    )}`;
  }
}

export const intellisenseService = new IntellisenseService();
