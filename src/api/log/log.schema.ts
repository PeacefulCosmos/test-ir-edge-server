import { Static, Type } from '@sinclair/typebox';

//Find All
export const GetAllLogResponse = Type.Array(Type.String());

export type GetAllLogResponseType = Static<typeof GetAllLogResponse>;

// Available
export const GetAvailalbeResponse = Type.Object({ available: Type.String() });

export type GetAvailalbeResponseType = Static<typeof GetAvailalbeResponse>;

//Get log content params
export const GetLogContentRequestParams = Type.Object({
  fileName: Type.String(),
});

export type GetLogContentRequestParamsType = Static<
  typeof GetLogContentRequestParams
>;

//Get log content response
export const GetLogContentResponse = Type.String();

export type GetLogContentResponseType = Static<typeof GetLogContentResponse>;
