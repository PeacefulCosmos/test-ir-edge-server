import { NedbServ } from '@app/components/nedb/nedb';

const collectionName = `person`;

export enum RoleType {
  TYPE_NORMAL = 'NORMAL',
  TYPE_VIP = 'VIP',
  TYPE_BLACKLIST = 'BLACKLIST',
}

export interface Person {
  _id?: string;
  name: string;
  type: RoleType;
  createdAt: Date;
  updatedAt: Date;
  uuid?: string;
  tag?: string;
  isPv3Employee?: boolean;
  template?: string;
  lastEnrollDate?: Date;
  _timeout?: {
    startTime: Date;
    paused: boolean;
  };
  enrollId?: string;
}

export const personDb: Datastore = NedbServ.connect(collectionName);

// export interface Person extends Document {
//   _id?: mongoose.Types.ObjectId;
//   name: string;
//   type: RoleType;
//   createdAt: Date;
//   updatedAt: Date;
//   uuid?: string;
//   tag?: string;
//   isV3Employee?: boolean;
//   template?: string;
//   lastEnrollDate?: Date;
// }

// export interface IPerson extends Person {}

// export const personSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   type: {
//     type: String,
//     required: true,
//   },
//   createdAt: {
//     type: Date,
//     required: true,
//     immutable: true,
//   },
//   updatedAt: {
//     type: Date,
//     requied: true,
//   },
//   uuid: {
//     type: String,
//     required: false,
//     immutable: true,
//   },
//   tag: {
//     type: String,
//     required: false,
//   },
//   isV3Employee: {
//     type: Boolean,
//     required: false,
//   },
//   template: {
//     type: String,
//     required: false,
//   },
//   lastEnrollDate: {
//     type: Date,
//     required: false,
//   },
// });

// export const PersonModel = mongoose.model<IPerson>(
//   "person",
//   personSchema,
//   "person"
// );
