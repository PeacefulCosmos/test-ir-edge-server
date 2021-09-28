export const _defaultConfig = {
  server: {
    port: 5000,
    sslPort: 5001,
  },
  socket: {
    tls: {
      host: "127.0.0.1",
      port: 9015,
      username: "inreality",
      password: "",
    },
  },
  intellisense: {
    cloud: {
      url: "https://analytics.inreality.com",
      context: "/ava2",
      username: "",
      password: "",
      enable: true,
    },
  },
  template: {
    min: 50,
    max: 2000,
    timeoutCron: "*/10 * * * * *",
    backupCron: "0 * * * * *",
    cleaningCron: "*/10 * * * * *",
    loggingCron: "0 0 * * * *",
    backupLogCron: "0 0 1 * * *",
    cleanBackupLogCron: "0 0 * * * *",
  },
  amqp: {
    url: "amqps://readwrite:UTEI17@127.0.0.1",
    server: "server",
  },
  apiUrl: "/api/",
  templateTimeout: 86400000,
  secretKey: "41973F315EB8879E6737FCA5FFC32",
  faceEngine: {
    apiUrl: "http://127.0.0.1:5050/recognize_face_2",
  },
  credentialFilepath:
    "/opt/apps/.data/com.inreality.dms-client-node/credential.json",
  employee: {
    checkerCron: "*/10 * * * * *",
    apiUrl: "https://v3-dev.inreality.com/v3/api/external/employees",
    callbackUrl:
      "https://v3-dev.inreality.com/v3/api/external/enrollmentCallback",
  },
  mongodb: {
    DEV_MONGO_IP: "mongo",
  },
};
