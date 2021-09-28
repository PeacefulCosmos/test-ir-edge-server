import moment from 'moment';
import { AppAPI, SysAPI } from '@inreality/desktop-player-lib';
import path from 'path';
import fs from 'fs-extra';
import uuid from 'uuid';
import { EventEmitter } from 'events';
import * as cron from 'cron';
import _ from 'lodash';
import { configService } from '@app/config/config.service';
import {
  PersonRoleType,
  PersonTemplatesType,
  PersonTemplateType,
} from '../person/person.schema';
import { deviceService, DeviceStatus } from '../device';
import { rabbitMQService } from '@comp/rabbitmq/rabbitmq.service';
import { loggingService } from '@comp/logging/logging.service';
import { ivhRabbittmqService } from '@comp/ivh-rmq/ivh-rmq.service';
import { CallbackFunc } from 'light-my-request';
import { personService } from '@api/person/person.service';
import { CacheType } from './template.schema';
import { HistoryType } from '../history/history.schema';
import { historyService } from '../history/history.service';

//JSON
const credentialFilePath =
  '/opt/apps/.data/com.inreality.dms-client-node/credential.json';
const configFilePath = '/opt/apps/app_config.json';
const appFilePath = '/opt/apps/com.inreality.ptp-socket-server/app.json';

const RESOURCE_FOLDER = AppAPI.getCurrent().getResourcesPath().val();
const TEMPLATE_FOLDER = path.join(RESOURCE_FOLDER, 'templates');
const CACHE_FOLDER = path.join(RESOURCE_FOLDER, 'faceCache');
const BACKUP_FOLDER = AppAPI.getCurrent().getLogsPath().val();

export class TemplateService {
  templates: PersonTemplateType[] = [];
  cleanIds: string[] = [];
  cachedMacAddr: string = null;

  eventEmitter = new EventEmitter();
  backupFileName = 'template_backup.json';

  // Cache
  caches: CacheType[] = [];
  lastUpdated: Date = null;

  //Cron Job
  jobs: any = {};

  async init(): Promise<void> {
    this.cachedMacAddr = await (
      await SysAPI.current().getMACAddress()
    ).replace(/:/g, '');
    await this.loadFromDist();
    await this.wait(1);
    await this.checkTimeout();
    await this.startCron();
  }

  async startCron(): Promise<void> {
    if (this.jobs['clean']) {
      this.jobs['clean'].stop();
    }
    if (this.jobs['backup']) {
      this.jobs['backup'].stop();
    }
    if (this.jobs['timeout']) {
      this.jobs['timeout'].stop();
    }
    if (this.jobs['logging']) {
      this.jobs['logging'].stop();
    }
    if (this.jobs['backupLog']) {
      this.jobs['backupLog'].stop();
    }
    if (this.jobs['cleanBackupLog']) {
      this.jobs['cleanBackupLog'].stop();
    }
    this.jobs['clean'] = this.cleaningCron();
    this.jobs['backup'] = this.backupCron();
    this.jobs['timeout'] = this.timeoutCron();
    this.jobs['logging'] = this.loggingCron();
    this.jobs['backupLog'] = this.backupLogCron();
    this.jobs['cleanBackupLog'] = this.cleanBackupLogCron();
  }

  backupLogCron(): cron.CronJob {
    try {
      return new cron.CronJob(
        configService.current.template.backupLogCron,
        async () => {
          await this.backupLog();
        },
        null,
        true
      );
    } catch (err) {
      return new cron.CronJob(
        '0 0 1 * * *',
        async () => {
          await this.backupLog();
        },
        null,
        true
      );
    }
  }

  cleanBackupLogCron(): cron.CronJob {
    try {
      return new cron.CronJob(
        configService.current.template.cleanBackupLogCron,
        async () => {
          await this.cleanBackupLog();
        },
        null,
        true
      );
    } catch (err) {
      return new cron.CronJob(
        '0 0 * * * *',
        async () => {
          await this.cleanBackupLog();
        },
        null,
        true
      );
    }
  }

  cleaningCron(): cron.CronJob {
    try {
      return new cron.CronJob(
        configService.current.template.cleaningCron,
        async () => {
          await this.checkTemplate();
          await this.checkCache();
        },
        null,
        true
      );
    } catch (err) {
      return new cron.CronJob(
        '*/10 * * * * *',
        async () => {
          await this.checkTemplate();
          await this.checkCache();
        },
        null,
        true
      );
    }
  }

  backupCron(): cron.CronJob {
    try {
      return new cron.CronJob(
        configService.current.template.backupCron,
        async () => {
          await this.saveToDisk();
        },
        null,
        true
      );
    } catch (err) {
      return new cron.CronJob(
        '*/10 * * * * *',
        async () => {
          await this.saveToDisk();
        },
        null,
        true
      );
    }
  }

  timeoutCron(): cron.CronJob {
    try {
      return new cron.CronJob(
        configService.current.template.timeoutCron,
        async () => {
          await this.checkTimeout();
        },
        null,
        true
      );
    } catch (err) {
      return new cron.CronJob(
        '0 * * * * *',
        async () => {
          await this.checkTimeout();
        },
        null,
        true
      );
    }
  }

  loggingCron(): cron.CronJob {
    try {
      return new cron.CronJob(
        configService.current.template.loggingCron,
        () => {
          loggingService.templateStatistics.info(
            `Total ${this.templates.length} face`
          );
        },
        null,
        true
      );
    } catch (err) {
      return new cron.CronJob(
        '0 0 * * * *',
        () => {
          loggingService.templateStatistics.info(
            `Total ${this.templates.length} face`
          );
        },
        null,
        true
      );
    }
  }

  async backupLog(): Promise<void> {
    if (this.templates.length > 0) {
      try {
        const logPath = AppAPI.getCurrent().getLogsPath();
        const backupFile = path.join(
          logPath.val(),
          `${moment().format('YYYYMMDD')}.facial_pattern`
        );
        const logs: string[] = [];
        const today = moment().format('YYYYMMDDHHmmssSSS');
        const timezone = moment().format('ZZ');
        const logVersion = '1.1.0';
        let vid = '';
        const serialId = '';
        const name = '';
        const vender = '';
        const model = '';
        let accountId = '';
        let storeId = '';
        const datasourceCode = '';
        const aoiId = '';
        const sensorId = '';
        let version = '1.1.0';
        const type = 'FACIAL_PATTERN';
        const credential = await fs.readJson(credentialFilePath);
        if (credential) {
          vid = credential.vid ? credential.vid : '';
          accountId = credential.accountId ? credential.accountId : '';
        }
        const config = await fs.readJson(configFilePath);
        if (config) {
          if (config.globals) {
            storeId = config.globals.store_id ? config.globals.store_id : '';
          }
        }
        const app = await fs.readJson(appFilePath);
        if (app) {
          version = app.version ? app.version : '';
        }
        await logPath.ensure();
        this.templates.forEach((template) => {
          if (template) {
            const log = [
              today,
              timezone,
              'ACTION',
              logVersion,
              accountId,
              vid,
              serialId,
              ivhRabbittmqService.cachedMacAddr,
              name,
              vender,
              model,
              storeId,
              aoiId,
              sensorId,
              datasourceCode,
              today,
              ivhRabbittmqService.packageName,
              version,
              type,
              JSON.stringify(JSON.stringify(template)),
            ];
            logs.push(log.join());
          }
        });
        await fs.appendFile(backupFile, `${logs.join('\r\n')}\r\n`);
      } catch (err) {
        console.error(err);
      }
    }
  }

  async cleanBackupLog(): Promise<void> {
    try {
      const files = await fs.readdir(BACKUP_FOLDER);
      files.forEach((file) => {
        if (
          file &&
          file.split('.').length === 2 &&
          file.split('.')[1] === 'facial_pattern'
        ) {
          if (
            moment().diff(moment(file.split('.')[0], 'YYYYMMDD'), 'days') > 30
          ) {
            fs.unlinkSync(path.join(BACKUP_FOLDER, file));
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  }

  async checkTemplate(): Promise<void> {
    if (this.templates.length > configService.current.template.max) {
      await this.reduceTemplates();
    }
  }

  async reduceTemplates(): Promise<void> {
    const min = configService.current.template.min;
    const tplLength = this.templates.length;
    const tpls: PersonTemplatesType = [];
    const people: PersonTemplatesType = [];
    this.templates
      .slice()
      .reverse()
      .forEach((template) => {
        if (template.type) {
          people.push(template);
        } else if (tpls.length < min) {
          tpls.push(template);
        }
      });

    if (people.length > 0) {
      this.templates = _.concat(people, tpls);
    }
    await this.broadcastCleanTemplate(tplLength);
  }

  async broadcastCleanTemplate(
    cleanLength: number,
    deletedTemplates?: string[]
  ): Promise<void> {
    const devices = await deviceService.findAll();
    const statuses: { mac: string; status: string }[] = [];
    devices.forEach((device) => {
      statuses.push({
        mac: device.mac,
        status: DeviceStatus.Pending,
      });
    });
    const jobId = uuid.v4();
    const history = {
      cleaned: cleanLength - this.templates.length,
      remain: this.templates.length,
      successCnt: 0,
      errorCnt: 0,
      jobId: jobId,
      devices: statuses,
    };
    historyService.create(history);
    rabbitMQService.broadcast('CLEAN_TEMPLATE', { jobId, deletedTemplates });
  }

  async updateJob(data: {
    jobId: string;
    mac: string;
    err: Error;
  }): Promise<void> {
    const { jobId, mac, err } = data;
    const query = { jobId: jobId };
    try {
      await deviceService.updateLastCleanDt(mac);
      const doc: HistoryType = await historyService.findOne(query);
      const { devices } = doc;
      let { successCnt, errorCnt } = doc;
      devices.forEach((device) => {
        if (device.mac === mac) {
          if (!err) {
            device.status = DeviceStatus.Active;
            successCnt++;
          } else {
            device.status = DeviceStatus.Error;
            errorCnt++;
          }
        }
      });
      const params = {
        successCnt: successCnt,
        errorCnt: errorCnt,
        devices: devices,
      };

      await historyService.update(query, params);
    } catch (err) {
      console.error(err);
      return;
    }
  }

  findCleanIds(): Promise<string[]> {
    return new Promise((rs, rj) => {
      rs(this.cleanIds);
    });
  }

  async checkTimeout(): Promise<void> {
    const now = moment();
    const tplLength = this.templates.length;
    const deletedTemplates: string[] = [];
    this.templates
      .slice()
      .reverse()
      .forEach((template, i) => {
        if (template.type && template.type !== PersonRoleType.TYPE_NORMAL) {
          return;
        }
        //Check timeout -------------------------------------/
        const diffMinSec = now.diff(template._timeout.startTime);
        if (diffMinSec >= configService.current.templateTimeout) {
          console.log(
            `A template timeout (idx: ${this.templates.length - 1 - i} value: ${
              configService.current.templateTimeout
            })`
          );
          this.templates.splice(i, 1);
          deletedTemplates.push(template.uuid);
        }
      });
    if (tplLength !== this.templates.length) {
      this.broadcastCleanTemplate(tplLength, deletedTemplates);
    }
  }

  async loadFromDist(): Promise<void> {
    try {
      const resourcePath = await AppAPI.getCurrent().getResourcesPath();
      const backupFile = path.join(resourcePath.val(), this.backupFileName);
      this.templates = await fs.readJSON(backupFile);
      this.templates.forEach((template) => {
        if (
          Object.prototype.hasOwnProperty.call(template, 'tag') &&
          template.tag !== null
        ) {
          template.tag = template.tag
            .replace(/,/g, '')
            .replace(/'/g, '')
            .replace(/"/g, '');
        }
      });
      console.log(
        `[${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] Loaded ${
          this.templates.length
        } templates`
      );
      return;
    } catch (err) {
      console.warn('Template not found or not a valid JSON, restore to empty');
      return;
    }
  }

  async saveToDisk(): Promise<void> {
    try {
      if (this.caches.length > 0) {
        this.caches[this.caches.length - 1].modified = true;
      }
      const resourcePath = AppAPI.getCurrent().getResourcesPath();
      const backupFile = path.join(resourcePath.val(), this.backupFileName);
      console.log(
        `[${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] Backup ${
          this.templates.length
        } templates...`
      );

      await resourcePath.ensure();
      await fs.writeJson(backupFile, this.templates);
    } catch (err) {
      console.error(err);
    }
  }

  on(eventName: string, fn: CallbackFunc): void {
    this.eventEmitter.on(eventName, fn);
  }

  createTemplate(template: PersonTemplateType): PersonTemplateType {
    let existsTemplateIdx = -1;
    template._timeout = {
      startTime: moment().toDate().toISOString(),
      paused: false,
    };

    this.templates.every((tpl, idx) => {
      if (tpl.uuid === template.uuid) {
        existsTemplateIdx = idx;
        return false;
      } else {
        return true;
      }
    });

    if (existsTemplateIdx !== -1) {
      this.templates.splice(existsTemplateIdx, 1);
    }
    this.templates.push(template);
    return template;
  }

  requestTemplate(uuid: string): void {
    this.templates.every((template) => {
      if (template.uuid === uuid) {
        template._timeout.startTime = moment().toISOString();
        return false;
      } else {
        return true;
      }
    });
  }

  findAll(): Promise<PersonTemplateType[]> {
    return new Promise((rs) => {
      rs(this.templates);
    });
  }

  async findByEnrollId(
    enrollId: string,
    def?: PersonTemplateType
  ): Promise<PersonTemplateType> {
    let targetTemplate: PersonTemplateType = null;
    for (const template of this.templates) {
      if (template.enrollId === enrollId) {
        targetTemplate = template;
        break;
      }
    }
    if (!targetTemplate && def) {
      targetTemplate = await this.createTemplate(def);
    }
    return targetTemplate;
  }

  async findByUUID(
    uuid: string,
    def: PersonTemplateType
  ): Promise<PersonTemplateType> {
    let targetTemplate: PersonTemplateType = null;
    for (const template of this.templates) {
      if (template.uuid === uuid) {
        targetTemplate = template;
        break;
      }
    }
    if (!targetTemplate && def) {
      targetTemplate = await this.createTemplate(def);
    }
    return targetTemplate;
  }

  assignEnrollDataToTemplate(
    enrollData: PersonTemplateType,
    template: PersonTemplateType
  ): void {
    if (enrollData._id) {
      template.enrollId = enrollData._id;
    }
    if (enrollData.name) {
      template.enrollId = enrollData.name;
    }
    if (enrollData.type) {
      template.enrollId = enrollData.type;
    }
    if (enrollData.template) {
      template.enrollId = enrollData.template;
    }
  }

  async enroll(params: {
    id: string;
    faceData: string;
  }): Promise<PersonTemplateType> {
    console.log(`Entry to enroll...`);
    const { id, faceData } = params;
    let personRecord: PersonTemplateType = null;
    let templateId = `${this.cachedMacAddr.substr(
      this.cachedMacAddr.length - 6
    )}-0000000000-${Math.round(new Date().getTime())}`;

    const oldPersonRecord = await personService.findOne({ _id: id });
    if (oldPersonRecord.uuid) {
      const isUUID = /^[a-fA-F0-9]{6}-[a-fA-F0-9]{10}-[a-fA-F0-9]{10}$/.test(
        oldPersonRecord.uuid
      );
      if (isUUID) {
        templateId = oldPersonRecord.uuid;
      }
    }
    console.log(`Enroll templateId ${templateId}`);
    ivhRabbittmqService.generateTemplate(
      templateId,
      faceData,
      async (error, data) => {
        console.log(`+++++ Rabbit enroll result +++++`);
        console.error(error);
        if (error) {
          const updateObj = {
            enrolled: true,
          };
          try {
            await personService.update(id, updateObj);
            return Promise.resolve(new Error(error));
          } catch (err) {
            return Promise.resolve(new Error(error));
          }
        } else {
          const tmpTemplateObj = {
            uuid: data.uuid,
            lastEnrollDate: new Date().toISOString(),
            template: data.template,
            enrolled: true,
          };
          await personService.update(id, tmpTemplateObj);
          personRecord = await personService.findOne({ _id: id });
          await fs.writeFile(
            path.join(CACHE_FOLDER, `${personRecord.name}_${uuid.v4()}.png`),
            faceData,
            'base64'
          );
          let templateObj = await this.findByEnrollId(id);
          if (!templateObj) {
            templateObj = await this.findByUUID(
              tmpTemplateObj.uuid,
              tmpTemplateObj
            );
          }
          this.assignEnrollDataToTemplate(personRecord, templateObj);
          try {
            rabbitMQService.broadcast('REFRESH');
            await this.saveToDisk();
          } catch (err) {
            console.error(err);
            return err;
          }
        }
      }
    );
    return personRecord;
  }

  async purge(opts: { types: string[] }): Promise<void> {
    const { types } = opts;
    const tplLength = this.templates.length;
    this.templates
      .slice()
      .reverse()
      .forEach((tpl, i) => {
        if (!tpl.type || types.indexOf(tpl.type) !== -1) {
          this.templates.splice(this.templates.length - 1 - i);
        }
      });
    if (tplLength !== this.templates.length) {
      await this.broadcastCleanTemplate(tplLength);
    }
  }

  async deleteByUUID(uuid: string): Promise<void> {
    this.templates.every((tpl, idx) => {
      if (tpl.uuid === uuid) {
        this.templates.splice(idx, 1);
        rabbitMQService.broadcast('TIMEOUT_TEMPLATE', { uuid });
        return false;
      } else {
        return true;
      }
    });
    return;
  }

  async getTemplatesStream(): Promise<string[]> {
    const results: string[] = [];
    if (!this.templates || this.templates.length < 0) {
      return results;
    }
    this.templates.forEach((template) => {
      const json = {
        template: template.template,
        uuid: template.uuid,
        tag: template.name,
        type: template.type,
      };
      const str = `JSON.stringify(${json})\n`;
      results.push(str);
    });
    return results;
  }

  async initWriteCache(): Promise<string | void> {
    new Promise((rs, rj) => {
      if (this.writeCache) {
        if (!this.caches[this.caches.length - 1].modified) {
          if (
            this.caches[this.caches.length - 1].length === this.templates.length
          ) {
            console.log(`no change`);
            rs(this.writeCache);
          }
        }
      }
    });
  }

  writeCache = new Promise<string>((rs, rj) => {
    const filename = this.generateCacheFile();
    try {
      Promise.resolve(fs.ensureFile(filename));
      this.caches.push({
        filepath: filename,
        length: this.templates.length,
        atime: moment(),
      });
      console.log('is pending');
      this.templates.forEach((templateObj) => {
        Promise.resolve(this.writeCacheToFile(templateObj, filename));
      });
      rs(filename);
    } catch (err) {
      rj(err);
    }
  });

  generateCacheFile(): string {
    return path.join(TEMPLATE_FOLDER, `${uuid.v4()}.log`);
  }

  async updateAccessTime(dir: string): Promise<void> {
    this.caches.forEach((cache) => {
      if (cache.filepath === dir) {
        cache.atime = moment();
      }
    });
  }

  async deleteTemplateByUuids(uuids: string[]): Promise<void> {
    this.templates
      .slice()
      .reverse()
      .forEach((tpl, i) => {
        if (uuids.includes(tpl.uuid)) {
          this.templates.splice(this.templates.length - 1 - i, 1);
        }
      });
    await this.saveToDisk();
  }

  async deletePv3Employees(): Promise<void> {
    this.templates
      .slice()
      .reverse()
      .forEach((tpl, i) => {
        if (tpl.isPv3Employee) {
          this.templates.splice(this.templates.length - 1 - i, 1);
        }
      });
    await this.saveToDisk();
  }

  async writeCacheToFile(
    templateObj: PersonTemplateType,
    filename: string
  ): Promise<string> {
    const json = {
      template: templateObj.template,
      uuid: templateObj.uuid,
      tag: templateObj.name,
      type: templateObj.type,
    };
    const str = `${JSON.stringify(json)}\n`;
    try {
      await fs.appendFile(filename, str);
      return filename;
    } catch (err) {
      console.error(err);
    }
  }

  async checkCache(): Promise<void> {
    this.caches
      .slice()
      .reverse()
      .forEach(async (cache, i) => {
        const { filepath, atime } = cache;
        const sec = moment().diff(atime, 'seconds');
        if (sec > 100) {
          this.caches.splice(this.caches.length - 1 - i, 1);
          await fs.unlink(filepath);
        }
      });
  }

  async wait(ms: number): Promise<void> {
    return new Promise<void>((res, rej) => {
      setTimeout(() => {
        res();
      }, ms);
    });
  }
}

export const templateService = new TemplateService();
