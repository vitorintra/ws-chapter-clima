function pingWorker() {
  const PING_INTERVAL = 10000; // 10s
  const RECONNECT_INTERVAL = 30000; // 30s

  setInterval(() => {
    self.postMessage("SendPing");
  }, PING_INTERVAL);

  setInterval(() => {
    self.postMessage("CheckPingResponse");
  }, RECONNECT_INTERVAL);
}

export default pingWorker;
