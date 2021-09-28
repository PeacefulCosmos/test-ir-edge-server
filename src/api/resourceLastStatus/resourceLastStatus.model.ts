import { NedbServ } from '@app/components/nedb/nedb';

const collectionName = 'resourceLastStatus';

export const resourceLastStatusDb: Datastore = NedbServ.connect(collectionName);
