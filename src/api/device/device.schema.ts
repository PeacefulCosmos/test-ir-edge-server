import { Static, Type } from '@sinclair/typebox';
import moment from 'moment';

export interface mqMacsLastHeartbeatType {
  [mac: string]: moment.Moment;
}

export interface DeviceTemplatesType {
  [mac: string]: DeviceType;
}

export interface lastDevicesStatusType {
  [mac: string]: DeviceStatus;
}

export enum DeviceStatus {
  Offline = 'F',
  Online = 'O',
  Active = 'A',
  Pending = 'P',
  Error = 'E',
}

// Device Schema
export const Device = Type.Object({
  _id: Type.Optional(Type.String()),
  ip: Type.Optional(Type.String()),
  mac: Type.String(),
  status: Type.Optional(Type.Enum(DeviceStatus)),
  socket: Type.Optional(Type.Any()),
  lastUpdated: Type.Optional(Type.String({ format: 'date-time' })),
  lastCleanDt: Type.Optional(Type.String({ format: 'date-time' })),
});

export type DeviceType = Static<typeof Device>;

// Post Call Update Device Schema
export const UpdateDeviceRequestParams = Type.Object({
  mac: Type.String(),
});

export type UpdateDeviceRequestParamsType = Static<
  typeof UpdateDeviceRequestParams
>;

// Delete Call Device Schema
export const DeleteDeviceRequestParams = Type.Object({
  mac: Type.String(),
});

export type DeleteDeviceRequestParamsType = Static<
  typeof UpdateDeviceRequestParams
>;

//Clean Template Request Body
export const CleanTemplateRequestBody = Type.Object({
  jobId: Type.String(),
});

export type CleanTemplateRequestBodyType = Static<
  typeof CleanTemplateRequestBody
>;

//Clean Template Request Params
export const CleanTemplateRequestParams = Type.Object({
  mac: Type.String(),
});

export type CleanTemplateRequestParamsType = Static<
  typeof CleanTemplateRequestParams
>;
