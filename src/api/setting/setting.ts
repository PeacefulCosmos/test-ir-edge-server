import { ConfigType } from '@app/config/config.schema';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  ErrorResponse,
  SuccessMessageResponse,
  SuccessMessageResponseType,
} from './setting.schema';
import { settingService } from './setting.service';

export const settingRouter = (
  fastify: FastifyInstance,
  opts: any,
  done: (err?: Error) => void
): void => {
  //get settins
  fastify.get(
    `/`,
    {
      schema: {
        response: {
          200: SuccessMessageResponse,
          400: ErrorResponse,
        },
      },
    },
    async (req: FastifyRequest, res: FastifyReply) => {
      try {
        const conf: ConfigType = await settingService.findAll();
        res.status(200).send(conf);
      } catch (err) {
        res.status(400).send(err);
      }
    }
  );

  //update
  fastify.put(`/`, async (req: FastifyRequest, res: FastifyReply) => {
    try {
      await settingService.update(req.body);
      res.status(200).send({ msg: 'OK' });
    } catch (err) {
      console.error(err);
      res.status(400).send({ errMsg: err });
    }
  });
  done();
};
