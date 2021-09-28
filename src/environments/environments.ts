// import { config } from "../config/config.default";

export const environment = {
  development: true,
  production: false,
  secreteKey: '&e2e2h7e8tA%^Sf1b2328yedftr5dxf&V',
  mongodb: {
    docker_dev_mongo: `mongodb://0.0.0.0:27018/edge-server`,
    // docker_dev_mongo: `mongodb://${config.mongodb.DEV_MONGO_IP}:27017/edge-server`,
  },
  nedb: {
    baseUrl: `./data/nedb/`,
  },
  credentialFilePath:
    '/opt/apps/.data/com.inreality.dms-client-node/credential.json',
  configFilePath: '/opt/apps/app_config.json',
};
