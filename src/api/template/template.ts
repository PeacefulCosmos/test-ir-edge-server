import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { templateService } from '.';
import fs from 'fs-extra';
import {
  DeleteByUUIDRequestParams,
  DeleteByUUIDRequestParamsType,
  ErrorResponse,
  ErrorResponseType,
  PostEnrollRequestBody,
  PostEnrollRequestBodyType,
  PostEnrollRequestParams,
  PostEnrollRequestParamsType,
  SuccessMessageReponseType,
  SuccessMessageResponse,
} from './template.schema';
import { PersonTemplate, PersonTemplateType } from '../person/person.schema';

export const templateRouter = (
  fastify: FastifyInstance,
  opts: any,
  done: (err?: Error) => void
): void => {
  //get templates
  fastify.get(`/`, async (req, res) => {
    try {
      await templateService.initWriteCache();
      const dir = await templateService.writeCache;
      await templateService.updateAccessTime(dir);
      const stream = await fs.createReadStream(dir);
      stream.pipe(await res);
      stream.on('data', () => {
        templateService.updateAccessTime(dir);
      });
    } catch (err) {
      res.status(400).send(err);
    }
  });

  //get count
  fastify.get(`/count`, async (req, res) => {
    res.send({ count: templateService.templates.length });
  });

  //clear list
  fastify.get(`/cleanIds`, async (req, res) => {
    try {
      const ids = await templateService.findCleanIds();
      res.status(200).send(ids);
    } catch (err) {
      res.status(400).send(err);
    }
  });

  //reset cron job
  fastify.post(`/crons`, async (req, res) => {
    await templateService.startCron();
    res.status(200).send({ msg: 'OK' });
  });

  //enroll
  fastify.post<{
    Params: PostEnrollRequestParamsType;
    Body: PostEnrollRequestBodyType;
    Response: PersonTemplateType | ErrorResponseType;
  }>(
    `/:id/enroll`,
    {
      schema: {
        params: PostEnrollRequestParams,
        body: PostEnrollRequestBody,
        response: {
          200: PersonTemplate,
          400: ErrorResponse,
        },
      },
    },
    async (req, res) => {
      const { faceData } = req.body;
      const { id } = req.params;
      try {
        const template = await templateService.enroll({ id, faceData });
        res.status(200).send(template);
      } catch (err) {
        res.status(400).send({ msg: String(err) });
      }
    }
  );

  fastify.delete(`/clean`, async (req, res) => {
    try {
      await templateService.purge({ types: ['NORMAL'] });
      res.status(200).send({ msg: 'OK' });
    } catch (err) {
      console.error(err);
      res.status(400).send({ errMsg: String(err) });
    }
  });

  fastify.delete<{
    Params: DeleteByUUIDRequestParamsType;
    Response: SuccessMessageReponseType | ErrorResponseType;
  }>(
    `/:uuid`,
    {
      schema: {
        params: DeleteByUUIDRequestParams,
        response: {
          200: SuccessMessageResponse,
        },
      },
    },
    async (req, res) => {
      try {
        await templateService.deleteByUUID(req.params.uuid);
        res.status(200).send({ msg: 'OK' });
      } catch (err) {
        console.error(err);
        res.status(400).send({ errMsg: String(err) });
      }
    }
  );
  done();
};
