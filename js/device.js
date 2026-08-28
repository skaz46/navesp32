const Device = {
  ws: null,
  connected: false,
  reconnectTimer: null,

  connect(onStatusChange, onLog) {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const url = `ws://${window.location.hostname}:81`;

    onLog(`Connecting to ESP32...`);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.connected = true;
        onStatusChange(true);
        onLog('ESP32 CONNECTED');
      };

      this.ws.onmessage = (event) => {
        console.log('ESP32:', event.data);
      };

      this.ws.onclose = () => {
        this.connected = false;
        onStatusChange(false);
        onLog('ESP32 DISCONNECTED');

        clearTimeout(this.reconnectTimer);

        this.reconnectTimer = setTimeout(() => {
          this.connect(onStatusChange, onLog);
        }, 3000);
      };

      this.ws.onerror = () => {
        onLog('WebSocket connection failed');
      };

    } catch (e) {
      this.connected = false;
      onStatusChange(false);
      onLog(`Connection error: ${e.message}`);
    }
  },

  send(data) {
    if (
      this.ws &&
      this.ws.readyState === WebSocket.OPEN
    ) {
      this.ws.send(JSON.stringify(data));
      console.log('Sent:', data);
      return true;
    }

    console.log('ESP32 not connected');
    return false;
  }
};
