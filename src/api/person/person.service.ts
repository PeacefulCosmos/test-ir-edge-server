import { personDb } from '.';
import { templateService } from '@app/api/template/template.service';
import {
  PersonFindRequestQueryType,
  PersonRoleType,
  PersonTemplatesType,
  PersonTemplateType,
  PersonUpdateResponseType,
} from './person.schema';

class PersonService {
  async find(
    query: PersonFindRequestQueryType,
    projection?: any
  ): Promise<PersonTemplatesType> {
    if (!query || Object.keys(query).length === 0) {
      query = {};
    }
    if (!projection || Object.keys(query).length === 0) {
      projection = {};
    }
    try {
      return await personDb.find(query, projection);
    } catch (err) {
      console.log(err);
    }
  }

  async findOne(query: { [key: string]: string }): Promise<PersonTemplateType> {
    if (query === null) {
      query = {};
    }
    try {
      return await personDb.findOne(query);
    } catch (err) {
      console.log(err);
    }
  }

  async findOneById(id: string): Promise<PersonTemplateType> {
    try {
      return personDb.findOne({ _id: id });
    } catch (err) {
      console.log(err);
    }
  }

  async create(person: PersonTemplateType): Promise<PersonTemplateType> {
    person.type = PersonRoleType.TYPE_NORMAL;
    person.created = new Date().toISOString();
    person.lastUpdated = new Date().toISOString();
    try {
      return await personDb.insert(person);
    } catch (err) {
      console.log(err);
    }
  }

  async update(id: string, data: any): Promise<PersonUpdateResponseType> {
    const query = { _id: id };
    const params = { ...query, ...data, lastUpdated: new Date().toISOString() };
    try {
      await personDb.update(
        query,
        { $set: { ...data, lastUpdated: params.lastUpdated } },
        { returnUpdatedDocs: false }
      );
      const updatedPerson: PersonTemplateType = await personDb.findOne(query);
      if (!updatedPerson.template) {
        return params;
      }

      const templateObj: PersonTemplateType =
        await templateService.findByEnrollId(id, updatedPerson);
      await templateService.assignEnrollDataToTemplate(
        updatedPerson,
        templateObj
      );
      templateService.saveToDisk();
      return params;
    } catch (err) {
      console.log(err);
    }
  }

  async delete(id: string): Promise<void> {
    const query = { _id: id };
    try {
      await personDb.remove(query, {});
      const templateObj: PersonTemplateType =
        await templateService.findByEnrollId(id);
      if (!templateObj) {
        return;
      }
      templateObj.type = PersonRoleType.TYPE_NORMAL;
      //RabbitmqServ.boardcast('REFRESH');

      templateService.saveToDisk();
      return;
    } catch (err) {
      console.log(err);
    }
  }

  async deleteV3Employees(): Promise<void> {
    const query = { isPv3Employee: true };
    const uuids: string[] = [];
    const opts = { multi: true };

    try {
      const employees: PersonTemplatesType = await this.find(query);
      if (!employees) {
        return;
      }
      employees.forEach((e) => {
        uuids.push(e.uuid);
      });
      await personDb.remove(query, opts);
      await templateService.deleteTemplateByUuids(uuids);
      return;
    } catch (err) {
      console.log(err);
    }
  }
}

export const personService = new PersonService();
