import { AppAPI } from '@inreality/desktop-player-lib';
import moment from 'moment';
import path from 'path';
import winston from 'winston';
import 'winston-daily-rotate-file';

class LoggingService {
  connection: winston.Logger = null;
  templateStatistics: winston.Logger = null;

  async init(): Promise<void> {
    let loggerOpts: winston.LoggerOptions = {};
    let opts = {};
    await AppAPI.getCurrent().getLogsPath().ensure();
    opts = {
      timestamp: () => {
        return moment().format('YYYY-MM-DD HH:mm:ss.SSS');
      },
      level: 'info',
      filename: path.resolve(
        AppAPI.getCurrent().getLogsPath().val(),
        'connection.log'
      ),
      datePattern: 'yyyyMMdd.',
      localTime: true,
      prepend: true,
      json: false,
      zippedArchive: true,
      maxFiles: '7d',
    };

    loggerOpts = {
      transports: [new winston.transports.DailyRotateFile(opts)],
    };
    this.connection = winston.createLogger(loggerOpts);

    opts = {
      timestamp: () => {
        return moment().format('YYYY-MM-DD HH:mm:ss.SSS');
      },
      level: 'info',
      filename: path.resolve(
        AppAPI.getCurrent().getLogsPath().val(),
        'template-statistics.log'
      ),
      datePattern: 'yyyyMMdd.',
      localTime: true,
      prepend: true,
      json: false,
      zippedArchive: true,
      maxFiles: '7d',
    };

    loggerOpts = {
      transports: [new winston.transports.DailyRotateFile(opts)],
    };
    this.templateStatistics = winston.createLogger(loggerOpts);
  }
}

export const loggingService = new LoggingService();
