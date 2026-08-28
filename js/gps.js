const GPS = {
  watchId: null,
  lastSentTime: 0,

  start(onUpdate, onError) {
    if (!navigator.geolocation) {
      onError('Geolocation not supported');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const data = {
          type: 'gps',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        if (pos.coords.heading !== null && !isNaN(pos.coords.heading)) {
          data.heading = pos.coords.heading;
        }
        if (pos.coords.speed !== null && !isNaN(pos.coords.speed)) {
          data.speed = pos.coords.speed;
        }

        onUpdate(data);
      },
      (err) => onError(err.message),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  },

  shouldSend() {
    const now = Date.now();
    if (now - this.lastSentTime >= 1000) {
      this.lastSentTime = now;
      return true;
    }
    return false;
  }
};