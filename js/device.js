const Device = {
  ws: null,
  connected: false,
  
  connect(address, onStatusChange, onLog) {
    if (!address) {
      onLog('Set a valid WebSocket address (e.g., 192.168.1.5:81)');
      return;
    }

    const url = address.startsWith('ws://') ? address : `ws://${address}`;
    onLog(`Connecting to ${url}...`);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.connected = true;
        onStatusChange(true);
        onLog('ESP32 CONNECTED');
      };

      this.ws.onclose = () => {
        this.connected = false;
        onStatusChange(false);
        onLog('ESP32 UNREACHABLE / DISCONNECTED');
      };

      this.ws.onerror = (err) => {
        onLog('Connection Error: Check IP or iOS Safari WebSocket Blocking');
      };
    } catch (e) {
      onLog(`Error: ${e.message}`);
    }
  },

  send(data) {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }
};