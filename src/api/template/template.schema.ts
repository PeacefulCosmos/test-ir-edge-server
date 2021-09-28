import { Static, Type } from '@sinclair/typebox';
import moment from 'moment';

export type CacheType = {
  filepath: string;
  length: number;
  atime: moment.Moment;
  modified?: boolean;
};

//enroll post request body
export const PostEnrollRequestBody = Type.Object({ faceData: Type.String() });

export type PostEnrollRequestBodyType = Static<typeof PostEnrollRequestBody>;

//enroll post request params
export const PostEnrollRequestParams = Type.Object({ id: Type.String() });

export type PostEnrollRequestParamsType = Static<
  typeof PostEnrollRequestParams
>;

//delete by uuid request
export const DeleteByUUIDRequestParams = Type.Object({ uuid: Type.String() });

export type DeleteByUUIDRequestParamsType = Static<
  typeof DeleteByUUIDRequestParams
>;

//error response
export const ErrorResponse = Type.Object({ errMsg: Type.String() });

export type ErrorResponseType = Static<typeof ErrorResponse>;

//success message reponse
export const SuccessMessageResponse = Type.Object({ msg: Type.String() });

export type SuccessMessageReponseType = Static<typeof SuccessMessageResponse>;
