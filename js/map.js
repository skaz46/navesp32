const MapController = {
  map: null,
  userMarker: null,
  destMarker: null,

  init(onMapTap) {
    // Default fallback view
    this.map = L.map('map').setView([13.0827, 80.2707], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.map.on('click', (e) => {
      onMapTap(e.latlng.lat, e.latlng.lng);
    });
  },

  updateUserPosition(lat, lon) {
    if (!this.userMarker) {
      this.userMarker = L.marker([lat, lon]).addTo(this.map).bindPopup("Current Location");
      this.map.setView([lat, lon], 15);
    } else {
      this.userMarker.setLatLng([lat, lon]);
    }
  },

  setDestination(lat, lon, label) {
    if (this.destMarker) {
      this.map.removeLayer(this.destMarker);
    }
    this.destMarker = L.marker([lat, lon]).addTo(this.map).bindPopup(label).openPopup();
  }
};