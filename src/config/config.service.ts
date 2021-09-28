import { AppAPI } from '@inreality/desktop-player-lib';
import { CnqApplication } from '@inreality/desktop-player-lib/target/dist/app/CnqApplication';
import { merge } from 'lodash';
import { _defaultConfig } from './config.default';
import cluster from 'cluster';
import { ConfigType } from './config.schema';

class ConfigService {
  currentApp: CnqApplication = null;
  _current: ConfigType = null;
  current: ConfigType = null;

  constructor() {
    Object.defineProperty(this, 'current', {
      get: () => {
        return this._current;
      },
      enumerable: true,
      configurable: true,
    });
  }

  async init() {
    this.currentApp = AppAPI.getCurrent();
    const configPath = this.currentApp.getConfigPath();
    try {
      await configPath.ensure();
      let config: ConfigType = await this.currentApp.getConfig();
      const mergedConfig: ConfigType = merge(_defaultConfig, config);
      if (cluster.isPrimary) {
        await this.currentApp.saveConfig(mergedConfig);
      }
      config = await this.resolveLocalAVAProConfig(config);
      config = await this.resolveLocalAVAConfig(config);
      this._current = config;
    } catch (err) {
      console.log(`Save default config to [${configPath}]`);
      await this.currentApp.saveConfig(_defaultConfig);
    }
  }

  async update(upset: any) {
    try {
      this._current = merge(this._current, upset);
      if (this.currentApp) {
        await this.currentApp.saveConfig(this._current);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async resolveLocalAVAProConfig(config: ConfigType): Promise<ConfigType> {
    const host = config.socket.tls.host;
    if (host !== '127.0.0.1' && host !== 'localhost') {
      console.warn(
        'Remote Linux AVA connection will not be save username and password to config, please config it manually'
      );
      return config;
    }
    try {
      const linuxAVAConfig = await (
        await AppAPI.getFromPackage('com.inreality.ava')
      ).getConfig();

      const { cloud } = config.intellisense;
      const { username, password } = linuxAVAConfig;
      const { tls } = config.socket;
      cloud.username = username;
      cloud.password = password;
      tls.username = username;
      tls.password = password;
      console.log(
        `Local Linux AVA Pro detected!\n  Saved:\n    Telnet username [${tls.username}]\n           password [${tls.password}]\n    Cloud username [${cloud.username}]\n          password [${cloud.password}]\nto config`
      );
      if (this.currentApp) {
        await this.currentApp.saveConfig(config);
      }

      return config;
    } catch (err) {
      console.warn(
        "Local linux ava pro not found or it haven't run at least once, root cause:",
        err
      );
      return config;
    }
  }

  async resolveLocalAVAConfig(config: ConfigType): Promise<ConfigType> {
    const host = config.socket.tls.host;
    if (host !== '127.0.0.1' && host !== 'localhost') {
      console.warn(
        'Remote Linux AVA connection will not be save username and password to config, please config it manually'
      );
      return config;
    }
    try {
      const linuxAVAConfig = await (
        await AppAPI.getFromPackage('com.cenique.linux-ava')
      ).getConfig();
      const { cloud } = config.intellisense;
      const [cUsername, cPassword] = Buffer.from(
        linuxAVAConfig.wstoken,
        'base64'
      )
        .toString()
        .split(':');
      const { tls } = config.socket;
      cloud.username = cUsername;
      cloud.password = cPassword;
      tls.username = linuxAVAConfig.telnetUsername;
      tls.password = linuxAVAConfig.telnetPassword;
      console.log(
        `Local Linux AVA detected!\n  Saved:\n    Telnet username [${tls.username}]\n           password [${tls.password}]\n    Cloud username [${cloud.username}]\n          password [${cloud.password}]\nto config`
      );
      if (this.currentApp) {
        await this.currentApp.saveConfig(config);
      }
      return config;
    } catch (err) {
      console.warn(
        "Local linux ava not found or it haven't run at least once, root cause:",
        err
      );
      return config;
    }
  }
}

export const configService = new ConfigService();
