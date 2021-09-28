import { FastifyInstance } from 'fastify';
import passport from 'passport';
import { authLocalService } from '../../components/auth/local.auth.service';
import {
  AuthLoginPostRequestBody,
  AuthLoginResponseType,
  AuthLoginResponse,
  AuthLoginPostRequestBodyType,
} from './auth.schema';

module.exports = (fastify: FastifyInstance, opts: any, done: any) => {
  fastify.get(`/`, (req, res) => {
    res.status(200).send('OK');
  });

  fastify.post<{
    Body: AuthLoginPostRequestBodyType;
    Response: AuthLoginResponseType;
  }>(`/login`, (req, res) => {
    console.log(req.body);
    return passport.authenticate(`local`, (err: Error, user, info) => {
      console.log(user);
      console.log(info);
      if (err != null) {
        return res.status(401).send(String(err));
      }
      if (!user) {
        return res.status(404).send(info);
      }

      const token = authLocalService.signToken(user._id, req.body.rememberMe);

      return res.send({
        token: token,
        role: user.role,
      });
    })(req, res);
  });
  done();
};
