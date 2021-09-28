import { environment } from '@env/environments';
import Datastore from 'nedb-promises';
import path from 'path';

const connect = (collection?: string): Datastore => {
  collection ? collection : 'test';
  const db: Datastore = Datastore.create(
    path.join(environment.nedb.baseUrl, `${collection}.db`)
  );
  return db;
};

export const NedbServ = Object.freeze({ connect });
