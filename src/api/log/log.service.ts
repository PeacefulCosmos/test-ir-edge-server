import { AppAPI } from '@inreality/desktop-player-lib';
import fs from 'fs-extra';
import path from 'path';

class LogService {
  async findAll() {
    const app = await AppAPI.getFromDomainAndAppName(
      'com.cenique',
      'wifi_bluetooth_api'
    );
    const files = await fs.readdir(app.getLogsPath().val());
    const logFiles = [];
    for (const file of files) {
      if (file.endsWith('wfe') || file.endsWith('bte')) {
        logFiles.push(file);
      }
    }
    return logFiles;
  }

  async available() {
    const app = await AppAPI.getFromDomainAndAppName(
      'com.cenique',
      'wifi_bluetooth_api'
    );
    await fs.access(app.getLogsPath().val(), fs.constants.F_OK);
    return;
  }

  async getDetail(fileName: string): Promise<string> {
    const app = await AppAPI.getFromDomainAndAppName(
      'com.cenique',
      'wifi_bluetooth_api'
    );
    return await fs.readFile(
      path.join(app.getLogsPath().val(), fileName),
      'utf8'
    );
  }
}

export const logService = new LogService();
