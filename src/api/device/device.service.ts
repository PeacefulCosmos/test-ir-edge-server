import { AppAPI, SysAPI } from '@inreality/desktop-player-lib';
import { deviceDb } from './device.model';
import {
  DeviceStatus,
  DeviceTemplatesType,
  DeviceType,
  lastDevicesStatusType,
  mqMacsLastHeartbeatType,
} from './device.schema';
import { loggingService } from '@app/components/logging/logging.service';
import _ from 'lodash';
import { rabbitMQService } from '@comp/rabbitmq/rabbitmq.service';
import moment from 'moment';
import { configService } from '@app/config/config.service';
import { urlToHttpOptions, URL } from 'url';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import path from 'path';
import fs from 'fs-extra';

class DeviceService {
  cachedMacAddr: string = null;
  devices: DeviceTemplatesType = {};
  rabbitMQDevices: any[] = [];
  mqHeartbeatMacs: string[] = [];
  mqMacsLastHeartbeat: mqMacsLastHeartbeatType = {};
  lastDevicesStatus: lastDevicesStatusType = {};

  async init() {
    await this.load();
    this.cachedMacAddr = await SysAPI.current().getMACAddress();
    setInterval(async () => {
      await this.checkOnlineStatus();
      await this.pullRabbitMQDeviceList();
    }, 5000);
    await this.pullRabbitMQDeviceList();
    return;
  }

  async load() {
    const devices: DeviceType[] = await deviceDb.find({});
    for (const d of devices) {
      const device = d;
      this.devices[d.mac] = device;
    }
    return;
  }

  async pullRabbitMQDeviceList() {
    const serverUrl = new URL(configService.current.amqp.url);
    const [username, password] = urlToHttpOptions(serverUrl).auth.split(':');
    const opts: AxiosRequestConfig = {
      auth: {
        username: username,
        password: password,
      },
    };
    try {
      const data: AxiosResponse<any[]> = await axios.get<any[]>(
        `http://${serverUrl.host}:15675/api/connections`,
        opts
      );
      const ips = data.data.map((device) => {
        return device.peer_host;
      });
      this.rabbitMQDevices = ips;
      await this.logStatusChangeDevices();
    } catch (err) {
      console.error(err.toString());
    }
  }

  async logStatusChangeDevices() {
    const offlinedDevices = [];
    for (const [mac, device] of Object.entries(this.devices)) {
      if (!Object.prototype.hasOwnProperty.call(this.lastDevicesStatus, mac)) {
        this.lastDevicesStatus[mac] = DeviceStatus.Offline;
      }
      const currentStatus =
        this.rabbitMQDevices.indexOf(device.ip) !== -1
          ? DeviceStatus.Online
          : DeviceStatus.Offline;
      if (this.lastDevicesStatus[mac] !== currentStatus) {
        if (currentStatus === DeviceStatus.Online) {
          loggingService.connection.info(`${mac} online`);
        } else {
          loggingService.connection.info(`${mac} offline`);
          offlinedDevices.push(mac);
        }
        this.lastDevicesStatus[mac] = currentStatus;
      }
    }
    if (offlinedDevices.length > 0) {
      this.sendOfflineDevicesDataToTelegram(offlinedDevices);
    }
  }

  async sendOfflineDevicesDataToTelegram(devices: any[]) {
    try {
      const telegramUrl = `${configService.current.intellisense.cloud.url}${configService.current.intellisense.cloud.context}/api/external/alert/telegram/`;
      const msgHeader =
        '=========\nEdge Device check\nBelow device are detect disconnected from MQ or offline:';
      const msgFooter =
        'That mean all related connect to MQ are not work on those device';
      const body = {
        username: configService.current.intellisense.cloud.username,
        password: configService.current.intellisense.cloud.password,
        mac: this.cachedMacAddr,
        message: `${msgHeader}\n\n${devices.join('\n')}\n\n${msgFooter}`,
      };
      console.log(`Send message to telegram...`);
      const response = await axios.post(telegramUrl, { data: body });
      console.log('Response', response.data);
    } catch (err) {
      console.log(err);
    }
  }

  async pushDevice(device: DeviceType) {
    if (Object.prototype.hasOwnProperty.call(this.devices, device.mac)) {
      this.devices[device.mac].status = DeviceStatus.Online;
      this.devices[device.mac].lastUpdated = new Date().toISOString();
      this.devices[device.mac].ip = device.ip;
      return await this.update(device.mac);
    }
    this.devices[device.mac] = device;
    device.status = DeviceStatus.Online;
    return await this.create(device);
  }

  async deviceHeartbeatUpdated(socketId: string) {
    for (const [mac, device] of Object.entries(this.devices)) {
      if (device._id === socketId) {
        device.lastUpdated = new Date().toISOString();
        await this.update(mac, {});
      }
    }
  }

  async destroy(id: string) {
    for (const [mac, device] of Object.entries(this.devices)) {
      if (device._id === id) {
        console.log(`[${new Date()}] ${mac} disconnected`);
        this.devices[mac].status = DeviceStatus.Offline;
      }
    }
  }

  async findAll(): Promise<DeviceType[]> {
    const devices: DeviceType[] = await deviceDb.find({});
    for (const d of devices) {
      for (const [key, refDevice] of Object.entries(this.devices)) {
        if (d.mac === refDevice.mac) {
          d.status =
            this.rabbitMQDevices.indexOf(d.ip) !== -1 ||
            this.mqHeartbeatMacs.indexOf(d.mac) !== -1
              ? DeviceStatus.Online
              : DeviceStatus.Offline;
          d.ip = refDevice.ip;
        }
      }
    }
    return devices;
  }

  async create(device: DeviceType): Promise<void> {
    try {
      await deviceDb.insert({
        mac: device.mac,
        status: DeviceStatus.Offline,
        lastUpdated: new Date(),
      });
      return;
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  async update(mac: string, data?: any): Promise<void> {
    let params = {
      lastUpdated: new Date(),
    };
    try {
      params = _.merge(params, data);
      await deviceDb.update(
        { mac: mac },
        { $set: params },
        { returnUpdatedDocs: false }
      );
      return;
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  async updateLastCleanDt(mac: string): Promise<void> {
    const updated = { lastCleanDt: new Date() };
    try {
      return await this.update(mac, updated);
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  async cleanTemplateByMac(mac: string) {
    rabbitMQService.broadcast('CLEAN_TEMPLATE_BY_MAC', { mac });
  }

  async broadcast(msg: string, data: any) {
    for (const [mac, device] of Object.entries(this.devices)) {
      if (Object.prototype.hasOwnProperty.call(device, 'socket')) {
        device.socket.emit(msg, data ? data : null);
      }
    }
  }

  addOnlineMac(mac: string) {
    this.mqMacsLastHeartbeat[mac] = moment();
  }

  async checkOnlineStatus(): Promise<void> {
    const online = [];
    console.log(this.mqMacsLastHeartbeat.toString());
    for (const [mac, lastHeartbeat] of Object.entries(
      this.mqMacsLastHeartbeat
    )) {
      const status =
        moment().diff(lastHeartbeat, 'seconds') < 30
          ? DeviceStatus.Online
          : DeviceStatus.Offline;
      if (status === DeviceStatus.Online) {
        online.push(mac);
        if (this.mqHeartbeatMacs.indexOf(mac) === -1) {
          console.log(`${mac} online`);
          await this.writeToLogFile(
            `${lastHeartbeat.format(
              'YYYY-MM-DD HH:mm:ss.SSSZ'
            )} ${mac} online \r\n`
          );
        }
      } else {
        if (this.mqHeartbeatMacs.indexOf(mac) !== -1) {
          console.log(`${mac} offline`);
          await this.writeToLogFile(
            `${lastHeartbeat.format(
              'YYYY-MM-DD HH:mm:ss.SSSZ'
            )} ${mac} offline \r\n`
          );
        }
      }
    }
    this.mqHeartbeatMacs = online;
  }

  async writeToLogFile(str: string) {
    const logPath = AppAPI.getCurrent().getLogsPath();
    const backupFile = path.join(
      logPath.val(),
      `${moment().format('YYYYMMDD')}.log`
    );
    await logPath.ensure();
    await fs.appendFile(backupFile, str);
  }

  async wait(ms: number) {
    return new Promise<void>((res, rej) => {
      setTimeout(() => {
        res();
      }, ms);
    });
  }
}

export const deviceService = new DeviceService();
