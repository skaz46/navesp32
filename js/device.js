const Device = {
  connected: false,

  DATABASE_URL: 'https://navesp32-15a05-default-rtdb.firebaseio.com',

  async connect(onStatusChange, onLog) {
    try {
      onLog('Connecting to Firebase...');

      const response = await fetch(
        `${this.DATABASE_URL}/nav.json`
      );

      if (!response.ok) {
        throw new Error(`Firebase HTTP ${response.status}`);
      }

      this.connected = true;
      onStatusChange(true);
      onLog('CLOUD LINK READY');

    } catch (error) {
      console.error(error);

      this.connected = false;
      onStatusChange(false);

      onLog(`Connection failed: ${error.message}`);
    }
  },

  async send(data) {
    try {
      const response = await fetch(
        `${this.DATABASE_URL}/nav.json`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        throw new Error(`Firebase HTTP ${response.status}`);
      }

      console.log('FIREBASE SENT:', data);

      return true;

    } catch (error) {
      console.error('Firebase send error:', error);
      return false;
    }
  }
};
