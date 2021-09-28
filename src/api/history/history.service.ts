import { cleanHistoryDb } from './history.model';
import {
  findOneHistoryQueryType,
  GetHistoryRequestQuerystringType,
  HistoryType,
  UpdateHistoryParamsType,
  UpdateHistoryQueryType,
} from './history.schema';

class HistoryService {
  async find(params: GetHistoryRequestQuerystringType) {
    let { page, size } = params;
    page = page ?? 1;
    size = size ?? 10;
    try {
      const history: HistoryType[] = await cleanHistoryDb
        .find<HistoryType>({})
        .sort({ lastUpdated: -1 })
        .skip((Number(page) - 1) * 10)
        .limit(Number(size))
        .exec();
      return history;
    } catch (err) {
      console.error(err);
      return err;
    }
  }

  async findOne(query: findOneHistoryQueryType) {
    try {
      return await cleanHistoryDb.findOne<HistoryType>(query);
    } catch (err) {
      console.error(err);
      return err;
    }
  }

  async create(history: HistoryType): Promise<void> {
    history.lastUpdated = new Date().toISOString();
    try {
      await cleanHistoryDb.insert(history);
    } catch (err) {
      console.error(err);
      return err;
    }
  }

  async update(query: UpdateHistoryQueryType, params: UpdateHistoryParamsType) {
    return await cleanHistoryDb.update(query, { $set: params });
  }

  async getCount(): Promise<number> {
    try {
      return await cleanHistoryDb.count({});
    } catch (err) {
      console.error(err);
      return err;
    }
  }
}

export const historyService = new HistoryService();
