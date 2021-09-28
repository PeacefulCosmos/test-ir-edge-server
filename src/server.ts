import { modulePathInit } from './alias';
modulePathInit();
import cluster from 'cluster';
import * as master from './master';
// import worker from './worker';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const init = () => {
  console.log('cluster isMaster:::::::' + cluster.isMaster);
  console.log('cluster isWorker:::::::' + cluster.isWorker);
  // console.log(cluster);
  console.log('cluster isPrimary:::::::' + cluster.isPrimary);
  if (cluster.isPrimary) {
    startMaster();
  } else if (cluster.isWorker) {
    startWorker();
  }
};

const startMaster = async () => {
  await master.init();
};

const startWorker = () => {};

init();
