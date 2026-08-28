const state = {
  gps: { active: false, lat: null, lon: null, accuracy: null, heading: null, speed: null },
  destination: null,
  esp32: { address: '', connected: false }
};

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Storage & Input UI
  state.esp32.address = Storage.getESPAddress();
  document.getElementById('esp-ip-input').value = state.esp32.address;

  // 2. Initialize Map
  MapController.init((lat, lon) => {
    state.destination = {
      type: 'destination',
      lat: parseFloat(lat.toFixed(6)),
      lon: parseFloat(lon.toFixed(6)),
      label: 'Selected Map Location'
    };
    MapController.setDestination(lat, lon, state.destination.label);
    updateUI();
  });

  // 3. Setup GPS Tracking
  GPS.start(
    (data) => {
      state.gps = { ...state.gps, ...data, active: true };
      document.getElementById('gps-status-indicator').className = 'status-tag on';
      document.getElementById('gps-status-indicator').innerText = 'GPS ● ACTIVE';
      
      MapController.updateUserPosition(data.lat, data.lon);
      updateUI();

      // Send to ESP32 (Throttled once per second)
      if (GPS.shouldSend() && Device.connected) {
        Device.send(data);
      }
    },
    (err) => {
      document.getElementById('debug-log').innerText = `GPS Error: ${err}`;
    }
  );

  // 4. Register Event Listeners
  document.getElementById('save-ip-btn').addEventListener('click', () => {
    const val = document.getElementById('esp-ip-input').value.trim();
    Storage.setESPAddress(val);
    state.esp32.address = val;
    document.getElementById('debug-log').innerText = 'Address saved locally.';
  });

  document.getElementById('test-conn-btn').addEventListener('click', () => {
    Device.connect(state.esp32.address, updateDeviceStatus, (msg) => {
      document.getElementById('debug-log').innerText = msg;
    });
  });

  document.getElementById('search-btn').addEventListener('click', performSearch);

  document.getElementById('send-btn').addEventListener('click', () => {
    if (state.destination && Device.connected) {
      Device.send(state.destination);
      document.getElementById('debug-log').innerText = 'Destination transmitted successfully.';
    }
  });

  // 5. Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js');
  }
});

function updateDeviceStatus(isConnected) {
  state.esp32.connected = isConnected;
  const tag = document.getElementById('device-status-indicator');
  if (isConnected) {
    tag.className = 'status-tag on';
    tag.innerText = 'DEVICE ● CONNECTED';
  } else {
    tag.className = 'status-tag off';
    tag.innerText = 'DEVICE ● DISCONNECTED';
  }
  updateUI();
}

function updateUI() {
  document.getElementById('val-lat').innerText = state.gps.lat ? state.gps.lat.toFixed(6) : '--';
  document.getElementById('val-lon').innerText = state.gps.lon ? state.gps.lon.toFixed(6) : '--';
  document.getElementById('val-acc').innerText = state.gps.accuracy ? `${Math.round(state.gps.accuracy)}m` : '--';
  document.getElementById('val-spd').innerText = state.gps.speed !== null && state.gps.speed !== undefined ? `${state.gps.speed.toFixed(1)} m/s` : '--';

  const sendBtn = document.getElementById('send-btn');
  if (state.destination) {
    document.getElementById('target-name').innerText = `${state.destination.label} (${state.destination.lat}, ${state.destination.lon})`;
    sendBtn.disabled = !state.esp32.connected;
  } else {
    sendBtn.disabled = true;
  }
}

async function performSearch() {
  const query = document.getElementById('search-input').value;
  if (!query) return;

  const resList = document.getElementById('search-results');
  resList.innerHTML = '<li>Searching...</li>';
  resList.classList.remove('hidden');

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
    const data = await res.json();
    resList.innerHTML = '';

    data.slice(0, 5).forEach((item) => {
      const li = document.createElement('li');
      li.innerText = item.display_name;
      li.addEventListener('click', () => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        state.destination = {
          type: 'destination',
          lat: lat,
          lon: lon,
          label: item.display_name.split(',')[0]
        };
        MapController.setDestination(lat, lon, state.destination.label);
        resList.classList.add('hidden');
        updateUI();
      });
      resList.appendChild(li);
    });
  } catch (err) {
    resList.innerHTML = '<li>Error finding locations</li>';
  }
}