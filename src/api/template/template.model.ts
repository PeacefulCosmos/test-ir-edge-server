import { NedbServ } from '@app/components/nedb/nedb';

const collectionName = `templates`;

export const templateDb: Datastore = NedbServ.connect(collectionName);

export interface Template {
  type: RoleType;
  created: Date;
  lastUpdated: Date;
  uuid?: string;
  name: string;
  tag?: string;
  isPv3Employee?: boolean;
  _id?: string;
  template?: string;
  lastEnrollDate?: Date;
  _timeout?: {
    startTime: Date;
    paused: boolean;
  };
  enrollId?: string;
}

export enum RoleType {
  TYPE_NORMAL = 'NORMAL',
  TYPE_VIP = 'VIP',
  TYPE_BLACKLIST = 'BLACKLIST',
}
