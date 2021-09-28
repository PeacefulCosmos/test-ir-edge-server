import { Static, Type } from '@sinclair/typebox';

export enum PersonRoleType {
  TYPE_NORMAL = 'NORMAL',
  TYPE_VIP = 'VIP',
  TYPE_BLACKLIST = 'BLACKLIST',
}

// Person Template Schema
export const PersonTemplate = Type.Object({
  name: Type.Optional(Type.String()),
  type: Type.Optional(Type.Enum(PersonRoleType)),
  created: Type.Optional(Type.String({ format: 'date-time' })),
  lastUpdated: Type.Optional(Type.String({ format: 'date-time' })),
  uuid: Type.Optional(Type.String()),
  tag: Type.Optional(Type.String()),
  isPv3Employee: Type.Optional(Type.Boolean()),
  _id: Type.Optional(Type.String()),
  template: Type.Optional(Type.String()),
  lastEnrollDate: Type.Optional(Type.String({ format: 'date-time' })),
  _timeout: Type.Optional(
    Type.Object({
      startTime: Type.String({ format: 'date-time' }),
      paused: Type.Boolean(),
    })
  ),
  enrollId: Type.Optional(Type.String()),
  enrolled: Type.Optional(Type.Boolean()),
});

export type PersonTemplateType = Static<typeof PersonTemplate>;

// Person Template Array Schema
export const PersonTemplates = Type.Array(PersonTemplate);

export type PersonTemplatesType = Static<typeof PersonTemplates>;

//Get Find Request Query
export const PersonFindRequestQuery = Type.Object({
  isPv3Employee: Type.Optional(Type.Boolean()),
  enrollId: Type.Optional(Type.String()),
  template: Type.Optional(Type.String()),
});

export type PersonFindRequestQueryType = Static<typeof PersonFindRequestQuery>;

//Get Find One Params
export const PersonRequestParamsId = Type.Object({
  id: Type.String(),
});

export type PersonRequestParamsIdType = Static<typeof PersonRequestParamsId>;

//Update Data
export const PersonUpdateData = Type.Object({});

export type PersonUpdateDataType = Static<typeof PersonUpdateData>;

//Update Response Type
export const PersonUpdateResponse = Type.Object({
  lastUpdated: Type.String({ format: 'date-time' }),
  _id: Type.String(),
  type: Type.String(),
});

export type PersonUpdateResponseType = Static<typeof PersonUpdateResponse>;
