// interface History {
//   cleaned: number;
//   remain: number;
//   successCnt: number;
//   errorCnt: number;
//   jobId: string;
//   devices: {
//     mac: string;
//     status: string;
//   }[];
// }

import { Static, Type } from '@sinclair/typebox';

export const History = Type.Object({
  cleaned: Type.Number(),
  remain: Type.Number(),
  successCnt: Type.Number(),
  errorCnt: Type.Number(),
  jobId: Type.String(),
  devices: Type.Array(
    Type.Object({
      mac: Type.String(),
      status: Type.String(),
    })
  ),
  lastUpdated: Type.Optional(Type.String({ format: 'date-time' })),
});

export type HistoryType = Static<typeof History>;

// get request quertstring
export const GetHistoryRequestQuerystring = Type.Object({
  page: Type.Optional(Type.Number()),
  size: Type.Optional(Type.Number()),
});

export type GetHistoryRequestQuerystringType = Static<
  typeof GetHistoryRequestQuerystring
>;

//get response object
export const GetHistoryResponse = Type.Object({
  total: Type.Number(),
  data: History,
});

export type GetHistoryResponseType = Static<typeof GetHistoryResponse>;

//error response object
export const ErrorResponse = Type.Object({
  errMsg: Type.String(),
});

export type ErrorResponseType = Static<typeof ErrorResponse>;

//find one query type
export type findOneHistoryQueryType = {
  jobId: string | null;
};

//update query type
export type UpdateHistoryQueryType = {
  jobId: string | null;
};

//update params type
export type UpdateHistoryParamsType = {
  successCnt: number;
  errorCnt: number;
  devices: {
    mac: string;
    status: string;
  }[];
};
