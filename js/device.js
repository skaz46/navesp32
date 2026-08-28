const Device = {
  device: null,
  server: null,
  service: null,
  characteristic: null,
  connected: false,

  SERVICE_UUID: "12345678-1234-1234-1234-1234567890ab",
  CHARACTERISTIC_UUID: "abcdefab-1234-1234-1234-abcdefabcdef",

  async connect(onStatusChange, onLog) {
    try {
      onLog("Searching for ESP32...");

      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { name: "ESP32 NAV" }
        ],
        optionalServices: [this.SERVICE_UUID]
      });

      this.device.addEventListener(
        "gattserverdisconnected",
        () => {
          this.connected = false;
          onStatusChange(false);
          onLog("ESP32 DISCONNECTED");
        }
      );

      onLog("Connecting...");

      this.server =
        await this.device.gatt.connect();

      this.service =
        await this.server.getPrimaryService(
          this.SERVICE_UUID
        );

      this.characteristic =
        await this.service.getCharacteristic(
          this.CHARACTERISTIC_UUID
        );

      this.connected = true;

      onStatusChange(true);
      onLog("ESP32 CONNECTED");

    } catch (error) {
      console.error(error);

      this.connected = false;
      onStatusChange(false);

      onLog("Connection failed: " + error.message);
    }
  },

  async send(data) {
    if (
      !this.connected ||
      !this.characteristic
    ) {
      console.log("ESP32 not connected");
      return false;
    }

    try {
      const json = JSON.stringify(data);
      const encoder = new TextEncoder();

      await this.characteristic.writeValue(
        encoder.encode(json)
      );

      console.log("BLE SENT:", json);

      return true;

    } catch (error) {
      console.error("BLE send error:", error);
      return false;
    }
  }
};
