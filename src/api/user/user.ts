import { FastifyInstance } from 'fastify';
import { userService } from './user.service';

export const userRouter = (
  fastify: FastifyInstance,
  opts: any,
  done: (err?: Error) => void
): void => {
  fastify.get(
    `/me`,
    {
      schema: {},
    },
    async (req, res) => {
      try {
        const user = await userService.findOneById(req.user._id);
        user.password = undefined;
        res.status(200).send(user);
      } catch (err) {
        res.status(400).send(String(err));
      }
    }
  );

  fastify.put(`/me`, async (req, res) => {
    const id = req.user._id;
    const { authPassord } = req.body;
    try {
      await userService.updateDetailGuard(id, authPassword);
      await userService.update(id, req.body);
      res.status(200).send({ msg: 'OK' });
    } catch (err) {
      res.status(400).send({ errMsg: String(err) });
    }
  });

  done();
};
