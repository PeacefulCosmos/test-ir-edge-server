import fastifyJWT from 'fastify-jwt';
import * as jwt from 'jsonwebtoken';
import * as passport from 'passport';
import fastifyPassport from 'fastify-passport';
import { IStrategyOptionsWithRequest, Strategy } from 'passport-local';
import { userService } from '@api/user/user.service';
import class AuthLocalService {
  passport = passport;
  secretKey = '&e2e2h7e8tA%^Sf1b2328yedftr5dxf&V';
  option: IStrategyOptionsWithRequest = {
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true,
  };
  LocalStrategy = new Strategy(
    this.option,
    async (req, username, password, cb) => {
      try {
        const user = await userService.login({ username, password });
        cb(null, user);
      } catch (err) {
        cb(err);
      }
    }
  );

  constructor() {
    this.passport.use(this.LocalStrategy);
    this.passport.serializeUser((user, done) => {
      delete user.password;
    });
  }

  // Sign JWT
  signToken(id: string, rememberMe: boolean): string {
    const key = {
      _id: id,
    };
    const expired = {
      expiresIn: rememberMe ? 60 * 60 * 24 : 60 * 60 * 1,
    };

    return jwt.sign(key, this.secretKey, expired);
  }
};

export const authLocalService = new AuthLocalService();
