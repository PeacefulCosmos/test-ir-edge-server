import { NedbServ } from '@app/components/nedb/nedb';

const collectionName = 'cleanHistory';

export const cleanHistoryDb: Datastore = NedbServ.connect(collectionName);
