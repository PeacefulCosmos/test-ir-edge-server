import { FastifyInstance } from 'fastify';
import {
  GetAllLogResponse,
  GetAvailalbeResponse,
  GetLogContentRequestParams,
  GetLogContentRequestParamsType,
  GetLogContentResponse,
  GetLogContentResponseType,
} from './log.schema';
import { logService } from './log.service';

export const logRouter = (
  fastify: FastifyInstance,
  opts: any,
  done: (err?: Error) => void
): void => {
  //Find All
  fastify.get(
    `/`,
    {
      schema: {
        response: {
          200: {
            type: 'array',
            item: GetAllLogResponse,
          },
          400: {
            msg: { type: 'any' },
          },
        },
      },
    },
    async (req, res) => {
      try {
        const logs = await logService.findAll();
        res.status(200).send(logs);
      } catch (err) {
        res.status(400).send({ errMsg: err });
      }
    }
  );
  //Has Logs
  fastify.get(
    `/available`,
    {
      schema: {
        response: {
          200: { GetAvailalbeResponse },
          403: { GetAvailalbeResponse },
        },
      },
    },
    async (req, res) => {
      try {
        await logService.available();
        res.status(200).send({ available: 'OK' });
      } catch (err) {
        res.status(403).send({ available: 'NOK' });
      }
    }
  );
  // Get log content
  fastify.get<{
    Params: GetLogContentRequestParamsType;
    Response: GetLogContentResponseType;
  }>(
    `/:fileName`,
    {
      schema: {
        params: GetLogContentRequestParams,
        response: {
          200: GetLogContentResponse,
          400: { errMsg: { type: 'any' } },
        },
      },
    },
    async (req, res) => {
      const { fileName } = req.params;
      try {
        const log = await logService.getDetail(fileName);
        res.status(200).send(log);
      } catch (err) {
        res.status(400).send({ errMsg: err });
      }
    }
  );

  fastify.get<{
    Params: GetLogContentRequestParamsType;
    Response: GetLogContentResponseType;
  }>(
    `/:fileName/download`,
    {
      schema: {
        params: GetLogContentRequestParams,
        response: {
          200: GetLogContentResponse,
          400: { errMsg: { type: 'any' } },
        },
      },
    },
    async (req, res) => {
      const { fileName } = req.params;
      try {
        const log = await logService.getDetail(fileName);
        //send log data
        res.headers({
          'Content-Disposition': `attachment; filename="${fileName}"`,
        });
        res.status(200).send(log);
      } catch (err) {
        res.status(400).send({ errMsg: err });
      }
    }
  );

  done();
};
