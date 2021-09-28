import { Type, Static } from '@sinclair/typebox';

export const User = Type.Object({
  username: Type.String(),
  password: Type.String(),
  _id: Type.Optional(Type.String()),
  role: Type.Optional(Type.String()),
});

export type UserType = Static<typeof User>;

export type UserUpdateDataType = {
  username?: string;
  password?: string;
};

export type UserLoginOptsType = {
  username?: string;
  password?: string;
};

export type UserChangePasswordOptsType = {
  password?: string;
  newPassword?: string;
};
