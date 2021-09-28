import { NedbServ } from '@app/components/nedb/nedb';

const collectionName = 'device';

export const deviceDb: Datastore = NedbServ.connect(collectionName);
