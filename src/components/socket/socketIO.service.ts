import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

class SocketIOService {
  clients: Socket[] = [];
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap> = null;

  async init() {
    const opts = {};
    this.io = new Server(opts);
    this.buildListener();
  }

  connect(app: any) {
    this.io.attach(app);
  }

  send(key: string, msg: any) {
    this.clients.forEach((client) => {
      client.emit(key, msg);
    });
  }

  buildListener() {
    this.io.on('connnection', (socket) => {
      this.clients.push(socket);
    });
  }
}

export const socketIOService = new SocketIOService();
