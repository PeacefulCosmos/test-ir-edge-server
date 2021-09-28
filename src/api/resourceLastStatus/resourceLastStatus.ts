import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export const resourceLastStatusRouter = (
  fastify: FastifyInstance,
  opts: any,
  done: any
): void => {
  fastify.get(`/`, async (req: FastifyRequest, res: FastifyReply) => {
    res.send("test");
  });
  done();
};
