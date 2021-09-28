import { userDb } from '@api/user/user.model';
import { configService } from '@app/config/config.service';
import { _defaultConfig } from '@app/config/config.default';
import { ConfigType } from '@app/config/config.schema';

class SettingService {
  async findAll(): Promise<ConfigType> {
    const cfg = configService.current;
    cfg.defaultConfig = _defaultConfig;
    return cfg;
  }

  async update(data: any) {
    return await configService.update(data);
  }

  async updateDetailGuard(id: string, password: string) {
    // await this.findOneById(id)
  }
}

export const settingService = new SettingService();
