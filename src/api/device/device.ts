import { FastifyInstance } from 'fastify';
import { deviceService } from './index';
import { templateService } from '../template/template.service';
import {
  CleanTemplateRequestBody,
  CleanTemplateRequestBodyType,
  CleanTemplateRequestParams,
  CleanTemplateRequestParamsType,
  DeleteDeviceRequestParams,
  DeleteDeviceRequestParamsType,
  UpdateDeviceRequestParams,
  UpdateDeviceRequestParamsType,
} from './device.schema';

export const deviceRouter = (
  fastify: FastifyInstance,
  opts: any,
  done: (err?: Error) => void
): void => {
  //Find All
  fastify.get(`/`, async (req, res) => {
    res.status(200).send(await deviceService.findAll());
  });

  // Update Device
  fastify.post<{
    Params: UpdateDeviceRequestParamsType;
    Response: string;
  }>(
    `/:mac`,
    {
      schema: {
        params: UpdateDeviceRequestParams,
        response: {
          200: { status: 'ok' },
        },
      },
    },
    async (req, res) => {
      const { mac } = req.params;
      const ip = (req.ip || req.connection.remoteAddress).replace(/^.*:/, '');
      console.log(ip);
      await deviceService.pushDevice({ mac, ip });
      res.send({ status: 'ok' });
    }
  );

  //Delete Device
  fastify.delete<{
    Params: DeleteDeviceRequestParamsType;
    Response: string;
  }>(
    `/:mac/template`,
    {
      schema: {
        params: DeleteDeviceRequestParams,
        response: { status: 'ok' },
      },
    },
    async (req, res) => {
      const { mac } = req.params;
      await deviceService.cleanTemplateByMac(mac);
      res.send({ status: 'ok' });
    }
  );

  //Clean Template
  fastify.post<{
    Body: CleanTemplateRequestBodyType;
    Params: CleanTemplateRequestParamsType;
  }>(
    `/:mac/cleaned-template`,
    {
      schema: {
        body: CleanTemplateRequestBody,
        params: CleanTemplateRequestParams,
        response: {
          200: { status: 'OK' },
          400: { status: 'NOK' },
        },
      },
    },
    async (req, res) => {
      const params = {
        jobId: req.body.jobId,
        mac: req.params.mac,
        err: null as Error,
      };
      console.log(`cleaned-template`, params);
      try {
        await templateService.updateJob(params);
        res.send({ status: 'OK' });
      } catch (err) {
        res.status(400).send({ status: 'NOK' });
      }
    }
  );

  done();
};
