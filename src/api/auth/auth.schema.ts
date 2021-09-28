import { Static, Type } from '@sinclair/typebox';
import { User } from '@api/user/user.schema';

export const AuthLoginPostRequestBody = Type.Object({
  username: Type.String(),
  password: Type.String(),
  rememberMe: Type.Boolean(),
});

export type AuthLoginPostRequestBodyType = Static<
  typeof AuthLoginPostRequestBody
>;

export const AuthLoginResponse = Type.Object({
  token: Type.String(),
  role: Type.String(),
});

export type AuthLoginResponseType = Static<typeof AuthLoginResponse>;
