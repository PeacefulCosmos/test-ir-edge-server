import { FastifyInstance } from 'fastify';
import { personService } from '.';
import {
  PersonTemplate,
  PersonTemplatesType,
  PersonTemplateType,
  PersonUpdateDataType,
  PersonUpdateData,
  PersonRequestParamsIdType,
  PersonRequestParamsId,
  PersonFindRequestQueryType,
  PersonFindRequestQuery,
  PersonUpdateResponse,
  PersonUpdateResponseType,
} from './person.schema';

export const personRouter = (
  fastify: FastifyInstance,
  opts: any,
  done: (err?: Error) => void
): void => {
  // Find All
  fastify.get<{
    Querystring: PersonFindRequestQueryType;
    Response: PersonTemplatesType;
  }>(
    `/`,
    {
      schema: {
        querystring: PersonFindRequestQuery,
        response: {
          200: {
            type: 'array',
            items: PersonTemplate,
          },
        },
      },
    },
    async (req, res) => {
      res.status(200).send(await personService.find(req.query));
    }
  );

  //Find One
  fastify.get<{
    Params: PersonRequestParamsIdType;
    Response: PersonTemplateType;
  }>(
    `/:id`,
    {
      schema: {
        params: PersonRequestParamsId,
        response: {
          200: PersonTemplate,
        },
      },
    },
    async (req, res) => {
      res.status(200).send(await personService.findOneById(req.params.id));
    }
  );

  //Create
  fastify.post<{
    Body: PersonTemplateType;
    Response: PersonTemplateType;
  }>(
    `/`,
    {
      schema: {
        body: PersonTemplate,
        response: {
          200: PersonTemplate,
        },
      },
    },
    async (req, res) => {
      res.status(200).send(await personService.create(req.body));
    }
  );

  //Update
  fastify.put<{
    Params: PersonRequestParamsIdType;
    Body: PersonUpdateDataType;
    Response: PersonUpdateResponseType;
  }>(
    `/:id`,
    {
      schema: {
        params: PersonRequestParamsId,
        body: PersonUpdateData,
        response: {
          200: PersonUpdateResponse,
        },
      },
    },
    async (req, res) => {
      res.status(200).send(await personService.update(req.params.id, req.body));
    }
  );

  //Delete
  fastify.delete<{
    Params: PersonRequestParamsIdType;
    Response: string;
  }>(
    `/:id`,
    {
      schema: {
        params: PersonRequestParamsId,
        response: {
          200: {
            type: 'string',
          },
        },
      },
    },
    async (req, res) => {
      await personService.delete(req.params.id);
      res.status(200).send('OK');
    }
  );
  done();
};
