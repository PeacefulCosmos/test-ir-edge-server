import { Template } from "@app/api/template/template.model";
import { RequestGenericInterface } from "fastify/types/request";
import { Person, RoleType } from "..";

export interface requestGeneric extends RequestGenericInterface {
  Params: {
    id: string;
  };

  Body: Template | Template[];
}
