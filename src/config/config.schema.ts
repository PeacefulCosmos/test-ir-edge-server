import { Static, Type } from '@sinclair/typebox';

export const Config = Type.Object({
  server: Type.Object({
    port: Type.Number(),
    sslPort: Type.Number(),
  }),
  socket: Type.Object({
    tls: Type.Object({
      host: Type.String(),
      port: Type.Number(),
      username: Type.String(),
      password: Type.String(),
    }),
  }),
  intellisense: Type.Object({
    cloud: Type.Object({
      url: Type.String(),
      context: Type.String(),
      username: Type.String(),
      password: Type.String(),
      enable: Type.Boolean(),
    }),
  }),
  template: Type.Object({
    min: Type.Number(),
    max: Type.Number(),
    timeoutCron: Type.String(),
    backupCron: Type.String(),
    cleaningCron: Type.String(),
    loggingCron: Type.String(),
    backupLogCron: Type.String(),
    cleanBackupLogCron: Type.String(),
  }),
  amqp: Type.Object({
    url: Type.String(),
    server: Type.String(),
  }),
  apiUrl: Type.String(),
  templateTimeout: Type.Number(),
  secretKey: Type.String(),
  faceEngine: Type.Object({
    apiUrl: Type.String(),
  }),
  credentialFilepath: Type.String(),
  employee: Type.Object({
    checkerCron: Type.String(),
    apiUrl: Type.String(),
    callbackUrl: Type.String(),
  }),
  mongodb: Type.Object({
    DEV_MONGO_IP: Type.String(),
  }),
  defaultConfig: Type.Optional(Type.Object({})),
});

export type ConfigType = Static<typeof Config>;

// export type ConfigType = {
//   server: {
//     port: number;
//     sslPort: number;
//   };
//   socket: {
//     tls: {
//       host: string;
//       port: number;
//       username: string;
//       password: string;
//     };
//   };
//   intellisense: {
//     cloud: {
//       url: string;
//       context: string;
//       username: string;
//       password: string;
//       enable: boolean;
//     };
//   };
//   template: {
//     min: number;
//     max: number;
//     timeoutCron: string;
//     backupCron: string;
//     cleaningCron: string;
//     loggingCron: string;
//     backupLogCron: string;
//     cleanBackupLogCron: string;
//   };
//   amqp: {
//     url: string;
//     server: string;
//   };
//   apiUrl: string;
//   templateTimeout: number;
//   secretKey: string;
//   faceEngine: {
//     apiUrl: string;
//   };
//   credentialFilepath: string;
//   employee: {
//     checkerCron: string;
//     apiUrl: string;
//     callbackUrl: string;
//   };
//   mongodb: {
//     DEV_MONGO_IP: string;
//   };
//   defaultConfig?: ConfigType;
// };
