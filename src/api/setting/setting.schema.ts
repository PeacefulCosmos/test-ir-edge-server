import { Static, Type } from '@sinclair/typebox';

//error response object
export const ErrorResponse = Type.Object({
  errMsg: Type.String(),
});

export type ErrorResponseType = Static<typeof ErrorResponse>;

//success response object
export const SuccessMessageResponse = Type.Object({
  msg: Type.String(),
});

export type SuccessMessageResponseType = Static<typeof SuccessMessageResponse>;
