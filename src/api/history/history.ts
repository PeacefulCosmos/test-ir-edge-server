import { FastifyInstance } from 'fastify';
import {
  ErrorResponse,
  GetHistoryRequestQuerystring,
  GetHistoryRequestQuerystringType,
  GetHistoryResponse,
  GetHistoryResponseType,
} from './history.schema';
import { historyService } from './history.service';

export const historyRouter = (
  fastify: FastifyInstance,
  opts: any,
  done: (err?: Error) => void
): void => {
  fastify.get<{
    Querystring: GetHistoryRequestQuerystringType;
    Response: GetHistoryResponseType;
  }>(
    `/`,
    {
      schema: {
        querystring: GetHistoryRequestQuerystring,
        response: {
          200: GetHistoryResponse,
          400: { errMsg: ErrorResponse },
        },
      },
    },
    async (req, res) => {
      try {
        const count = await historyService.getCount();
        const data = await historyService.find(req.query);
        res.status(200).send({
          total: count,
          data: data,
        });
      } catch (err) {
        res.status(400).send({ errMsg: err });
      }
    }
  );

  done();
};
