import ping from "./pingWorker";

interface IPayloadArg {
  channel: string;
  instId?: string;
}

interface IUnsubscribeProps {
  payload: IPayloadArg;
}

interface ISubscribeProps extends IUnsubscribeProps {
  callback: (message: string) => void;
}

interface ISubscribes {
  payload: IPayloadArg;
  callbacks: Array<(message: string) => void>;
}

export default class OkxWebSocketClient {
  private webSocket!: WebSocket;

  private pingWorker: Worker | null = null;

  private lastPong!: number;

  private pingInterval = 10000;

  private sendPingTimeout!: NodeJS.Timeout;

  private subscribes = new Map<string, ISubscribes>();

  private isSocketOpened = false;

  private setIsSocketOpened: (value: boolean) => void;

  private endpoint = "wss://ws.okx.com:8443/ws/v5/public";

  constructor(setIsSocketOpened: (value: boolean) => void, endpoint?: string) {
    if (endpoint) this.endpoint = endpoint;
    this.setIsSocketOpened = setIsSocketOpened;
  }

  init() {
    this.stopHeartbeat();
    this.webSocket = new WebSocket(this.endpoint);
    this.addEventListeners();
  }

  close() {
    clearTimeout(this.sendPingTimeout);
    this.webSocket.close();
    this.stopHeartbeat();
  }

  subscribe({ payload, callback }: ISubscribeProps) {
    const subscribe = this.subscribes.get(payload.channel);

    if (subscribe) {
      subscribe.callbacks.push(callback);
      subscribe.payload = payload;
    } else {
      this.subscribes.set(payload.channel, { callbacks: [callback], payload });
    }

    if (this.isSocketOpened) {
      this.webSocket.send(
        JSON.stringify({
          op: "subscribe",
          args: [payload],
        })
      );
    }
  }

  unsubscribe({ payload }: IUnsubscribeProps) {
    this.subscribes.delete(payload.channel);

    if (this.isSocketOpened) {
      this.webSocket.send(
        JSON.stringify({
          op: "unsubscribe",
          args: [payload],
        })
      );
    }
  }

  private heartbeat() {
    const pingWorkerBlob = new Blob([`(${ping.toString()})()`]);

    this.pingWorker = new Worker(URL.createObjectURL(pingWorkerBlob), {
      name: "okx-ping-worker",
    });

    this.pingWorker.onmessage = (event) => {
      if (event.data === "SendPing") this.sendPing();
      else if (event.data === "CheckPingResponse") this.checkPingResponse();
    };
  }

  private sendPing() {
    if (this.isSocketOpened) this.webSocket.send("ping");
  }

  private stopHeartbeat() {
    clearTimeout(this.sendPingTimeout);
    if (this.pingWorker) this.pingWorker.terminate();
    this.pingWorker = null;
  }

  private checkPingResponse() {
    if (Date.now() >= this.lastPong + 20000) {
      this.close();
      this.init();
    }
  }

  private addEventListeners() {
    this.webSocket.addEventListener("open", () => {
      this.sendPingTimeout = setTimeout(
        () => this.heartbeat(),
        this.pingInterval
      );

      this.isSocketOpened = true;
      this.setIsSocketOpened(true);

      this.resubscribe();
    });

    this.webSocket.addEventListener("close", () => {
      this.isSocketOpened = false;
      this.setIsSocketOpened(false);
      this.stopHeartbeat();
    });

    this.webSocket.addEventListener("message", (evt) => this.onMessage(evt));
  }

  private onMessage(event: MessageEvent<string>) {
    clearTimeout(this.sendPingTimeout);
    this.sendPingTimeout = setTimeout(
      () => this.heartbeat(),
      this.pingInterval
    );

    if (event.data === "pong") {
      this.lastPong = Date.now();
      return;
    }

    if (this.pingWorker) {
      this.pingWorker.terminate();
      this.pingWorker = null;
    }

    const message = JSON.parse(event.data);

    if (message.arg?.channel) {
      const subscribe = this.subscribes.get(message.arg.channel);

      if (!message.arg?.instId) {
        subscribe?.callbacks.forEach((callback) => callback(event.data));
      } else if (subscribe?.payload?.instId === message.arg?.instId) {
        subscribe?.callbacks.forEach((callback) => callback(event.data));
      }
    }
  }

  private resubscribe() {
    if (this.subscribes.size) {
      this.subscribes.forEach((subscribe) =>
        this.webSocket.send(
          JSON.stringify({
            op: "subscribe",
            args: [{ ...subscribe.payload }],
          })
        )
      );
    }
  }
}
