import { AppAPI } from '@inreality/desktop-player-lib';
import path from 'path';
import fs from 'fs-extra';
import { resourceLastStatusDb } from './resourceLastStatus.model';
import { personService } from '../person';
import { PersonTemplateType } from '../person/person.schema';
import {
  PersonQueryType,
  ResourceLastStatusType,
} from './resourceLastStatus.schema';

class ResourceLastStatusService {
  getConfigPath() {
    return path.join(
      AppAPI.getCurrent().getRootDataDir().val(),
      'resources_lastupdate.json'
    );
  }

  async getServerEmployeeStatusTimestamp() {
    console.log(`========== config path`);
    console.log(this.getConfigPath());
    try {
      const config = await (await fs.readFile(this.getConfigPath())).toString();
      const data = JSON.parse(config);
      if (!data || !data.employees) {
        return null;
      } else {
        return data.employees.server_last_update;
      }
    } catch (err) {
      console.error(err);
    }
  }

  async getLocalEmployeeStatus(): Promise<ResourceLastStatusType> {
    const query = { type: 'EMPLOYEES' };
    try {
      return await resourceLastStatusDb.findOne(query);
    } catch (err) {
      console.error(err);
      return err;
    }
  }

  async setEmployeeListStatus(): Promise<void> {
    try {
      let timestamp = await this.getServerEmployeeStatusTimestamp();
      timestamp = timestamp ?? new Date().getTime();
      const query = { type: 'EMPLOYEES' };
      const body = {
        $set: {
          lastServerTimestamp: timestamp,
          updating: false,
        },
      };
      const opts = { upsert: true };
      await resourceLastStatusDb.update(query, body, opts);
      return;
    } catch (err) {
      console.error(err);
      return err;
    }
  }

  async setEmployeeListUpdating(): Promise<void> {
    const query = { type: 'EMPLOYEES' };
    const body = {
      $set: {
        updating: true,
      },
    };
    const opts = { upsert: true };
    try {
      await resourceLastStatusDb.update(query, body, opts);
      return;
    } catch (err) {
      console.error(err);
      return err;
    }
  }

  async checkEmployeeWithNoTemplate(): Promise<PersonTemplateType[]> {
    const query: PersonQueryType = {
      isPv3Employee: true,
      enrolled: null,
      template: null,
    };
    try {
      return await personService.find(query);
    } catch (err) {
      console.error(err);
      return err;
    }
  }

  async checkEmployeeListStatus(): Promise<boolean> {
    try {
      const serverTimestamp = await this.getServerEmployeeStatusTimestamp();
      const localStatus = await this.getLocalEmployeeStatus();
      console.log('============');
      console.log(serverTimestamp);
      console.log(localStatus);
      if (!localStatus) {
        return true;
      }
      if (localStatus.updating) {
        return false;
      }
      const personList = await this.checkEmployeeWithNoTemplate();
      if (personList && personList.length > 0) {
        console.log('Has employee that is not enrolled');
        console.log(personList);
        return true;
      }
      if (!serverTimestamp && localStatus.lastServerTimestamp) {
        return false;
      }
      return (
        !localStatus.updating &&
        serverTimestamp !== localStatus.lastServerTimestamp
      );
    } catch (err) {
      console.error(err);
      return err;
    }
  }
}

export const resourceLastStatusService = new ResourceLastStatusService();
