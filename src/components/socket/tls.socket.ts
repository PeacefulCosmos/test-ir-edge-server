import { configService } from '@app/config/config.service';
import net from 'net';
import tls from 'tls';

class TLSSocketService {
  socket: tls.TLSSocket = null;
  authenticated = false;
  timeoutId: ReturnType<typeof setTimeout> = null;

  connect() {
    return new Promise<void>((rs, rj) => {
      rs();
      this._connect();
    });
  }

  send(key: string, msg: any) {
    this.socket.write(`${key},${msg}\n`);
  }

  _connect() {
    console.log(`tls socket _connect()::::::::::::::::::::::::::`);
    const { host, port, username, password } = configService.current.socket.tls;
    //create new instance
    this.socket = new tls.TLSSocket(new net.Socket());
    // console.log(this.socket);
    this.socket.connect(port, host, () => {
      console.log(`[TLS] Writing auth message...`);
      this.socket.write(`auth,${username},${password},sdk\n`);
      this.timeoutId = setTimeout(() => {
        this._closeAndReconnect();
      }, 10000);
      this.socket.once('data', (data) => {
        clearTimeout(this.timeoutId);
        const authMsg = data.toString('utf8').trim();
        if (authMsg === 'OK') {
          this.authenticated = true;
          console.log('>>> AVA connected <<<');
          return;
        }
        this.authenticated = false;
      });
    });

    this.socket.once('error', (err) => {
      setTimeout(() => {
        this._closeAndReconnect();
      }, 1000);
    });
  }

  _closeAndReconnect() {
    console.log(`tls socket _closeAndReconnect()::::::::::::::::::::::::::`);
    clearTimeout(this.timeoutId);
    this.socket.destroy();
    this.socket.removeAllListeners();
    this.authenticated = false;
    this._connect();
  }
}

export const tlsSocketService = new TLSSocketService();
