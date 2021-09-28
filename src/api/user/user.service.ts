// import { init } from '../../alias';
// init();
import { userDb } from './user.model';
import {
  UserChangePasswordOptsType,
  UserLoginOptsType,
  UserType,
  UserUpdateDataType,
} from './user.schema';

class UserService {
  PASSWD_SECRET = 'ndws8aTY^&gwdeb12b4e^R%TSA^Dg2b1eu';
  async init(): Promise<void> {
    const count = await userDb.count({});
    if (count === 0) {
      const newUser = {
        username: 'admin',
        password: 'admin',
      };
      userDb.insert(newUser);
    }
  }

  async findOneById(id: string): Promise<UserType> {
    return await userDb.findOne({ _id: id });
  }

  async update(id: string, data: UserUpdateDataType): Promise<void> {
    const { username, password = '' } = data;
    const query = { _id: id };
    let params = { lastUpdated: new Date() };

    const updateData = { username: username };
    if (password.length !== 0) {
      Object.assign(updateData, { password: password });
    }
    params = Object.assign(params, updateData);
    console.log(params);
    try {
      await userDb.update(
        query,
        { $set: params },
        { returnUpdatedDocs: false }
      );
      return;
    } catch (err) {
      console.error(err);
      return err;
    }
  }

  async login(opts: UserLoginOptsType): Promise<UserType> {
    const { username, password } = opts;
    const query = { username: username };
    try {
      const result: UserType = await userDb.findOne(query);
      if (!result) {
        throw new Error('Incorrect username!');
      }
      if (result.password !== password) {
        throw new Error('Incorrect password!');
      }
      return result;
    } catch (err) {
      console.error(err);
      return err;
    }
  }

  async updateDetailGuard(id: string, password: string): Promise<void> {
    try {
      const user = await this.findOneById(id);
      if (!user) {
        throw new Error('User not exists');
      }
      if (user.password !== password) {
        throw new Error('Old password invalid');
      }
    } catch (err) {
      console.error(err);
      return err;
    }
  }

  async changePassword(
    id: string,
    opts: UserChangePasswordOptsType
  ): Promise<void> {
    const { password, newPassword } = opts;
    try {
      if (!newPassword || newPassword.length === 0) {
        throw new Error('Missing new password');
      }
      await this.updateDetailGuard(id, password);
      await this.update(id, { password: newPassword });
    } catch (err) {
      console.error(err);
      return err;
    }
  }
}

export const userService = new UserService();

// const main = async () => {
//   await userService.update('123', { username: 'Roy', password: '123' });
// };

// main();
