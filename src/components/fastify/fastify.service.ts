import Fastify, { FastifyInstance } from 'fastify';
import fastifyMultipart from 'fastify-multipart';
import fastifyExpress from 'fastify-express';
import cors from 'fastify-cors';
import fastifyJwt from 'fastify-jwt';
import middle from 'middie';
import * as route from '../../route';
import { configService } from '../../config/config.service';

class FastifyService {
  PORT = 3000;
  ADDRESS = '127.0.0.1';
  fastify: FastifyInstance;
  secretKey = '&e2e2h7e8tA%^Sf1b2328yedftr5dxf&V';

  constructor() {
    this.fastify = Fastify({});
  }

  async init() {
    await configService.init();
  }

  async connect(): Promise<void> {
    await this.fastify.register(fastifyExpress);
    await this.fastify.register(middle);
    await this.fastify.register(cors);
    await this.fastify.register(fastifyMultipart);
    await this.fastify.register(fastifyJwt, {
      secret: this.secretKey,
    });
    await this.fastify.addHook('onRequest', async (req, res) => {
      try {
        await req.jwtVerify();
      } catch (err) {
        console.error(err);
        res.status(400).send(err);
      }
    });
    route.router(this.fastify);
    try {
      // await mongoConnection();

      this.fastify.listen(this.PORT, this.ADDRESS);
    } catch (err) {
      this.fastify.log.error(err);
      process.exit(1);
    }
  }

  // async cleanDefaultPage() {
  //   const layers;
  // }
}

export const fastifyService = new FastifyService();
