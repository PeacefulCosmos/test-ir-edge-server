import { NedbServ } from '@app/components/nedb/nedb';

const collectionName = `user`;

export const userDb: Datastore = NedbServ.connect(collectionName);
