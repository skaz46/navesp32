const state = {
  gps: {
    active: false,
    lat: null,
    lon: null,
    accuracy: null,
    heading: null,
    speed: null
  },

  destination: null,

  esp32: {
    connected: false
  }
};

document.addEventListener('DOMContentLoaded', () => {

  // MAP
  MapController.init((lat, lon) => {

    state.destination = {
      type: 'destination',
      lat: parseFloat(lat.toFixed(6)),
      lon: parseFloat(lon.toFixed(6)),
      label: 'Selected Map Location'
    };

    MapController.setDestination(
      lat,
      lon,
      state.destination.label
    );

    updateUI();
  });


  // BLE CONNECT BUTTON
  document
    .getElementById('connect-device-btn')
    .addEventListener('click', async () => {

      await Device.connect(
        updateDeviceStatus,
        (msg) => {
          document.getElementById('debug-log').innerText = msg;
        }
      );
    });



  // GPS
  GPS.start(

    (data) => {

      state.gps = {
        ...state.gps,
        ...data,
        active: true
      };

      const gpsTag =
        document.getElementById('gps-status-indicator');

      gpsTag.className = 'status-tag on';
      gpsTag.innerText = 'GPS ● ACTIVE';

      MapController.updateUserPosition(
        data.lat,
        data.lon
      );

      updateUI();


      // SEND GPS ONCE PER SECOND
      if (GPS.shouldSend() && Device.connected) {

        Device.send({
          type: 'gps',
          lat: data.lat,
          lon: data.lon,
          accuracy: data.accuracy,
          ...(data.heading !== undefined
            ? { heading: data.heading }
            : {}),
          ...(data.speed !== undefined
            ? { speed: data.speed }
            : {})
        });
      }
    },


    (err) => {

      const gpsTag =
        document.getElementById('gps-status-indicator');

      gpsTag.className = 'status-tag off';
      gpsTag.innerText = 'GPS ● ERROR';

      document.getElementById('debug-log').innerText =
        `GPS Error: ${err}`;
    }
  );


  // DESTINATION SEARCH
  document
    .getElementById('search-btn')
    .addEventListener('click', performSearch);


  // ALLOW ENTER TO SEARCH
  document
    .getElementById('search-input')
    .addEventListener('keydown', (e) => {

      if (e.key === 'Enter') {
        performSearch();
      }
    });


  // SEND DESTINATION
  document
    .getElementById('send-btn')
    .addEventListener('click', () => {

      if (!state.destination) {

        document.getElementById('debug-log').innerText =
          'Select a destination first.';

        return;
      }

      if (!Device.connected) {

        document.getElementById('debug-log').innerText =
          'ESP32 is not connected.';

        return;
      }


      const packet = {
        type: 'destination',
        lat: state.destination.lat,
        lon: state.destination.lon,
        label: state.destination.label
      };


      if (Device.send(packet)) {

        document.getElementById('debug-log').innerText =
          'Destination sent to ESP32.';
      }
    });


  // SERVICE WORKER
  if ('serviceWorker' in navigator) {

    navigator.serviceWorker
      .register('./service-worker.js')
      .catch(err => console.log(
        'Service worker error:',
        err
      ));
  }

});


function updateDeviceStatus(isConnected) {

  state.esp32.connected = isConnected;

  const tag =
    document.getElementById('device-status-indicator');


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

  document.getElementById('val-lat').innerText =
    state.gps.lat !== null
      ? state.gps.lat.toFixed(6)
      : '--';

  document.getElementById('val-lon').innerText =
    state.gps.lon !== null
      ? state.gps.lon.toFixed(6)
      : '--';

  document.getElementById('val-acc').innerText =
    state.gps.accuracy !== null
      ? `${Math.round(state.gps.accuracy)} m`
      : '--';

  document.getElementById('val-spd').innerText =
    state.gps.speed !== null &&
    state.gps.speed !== undefined
      ? `${state.gps.speed.toFixed(1)} m/s`
      : '--';


  const sendBtn =
    document.getElementById('send-btn');


  if (state.destination) {

    document.getElementById('target-name').innerText =
      state.destination.label;

    sendBtn.disabled =
      !state.esp32.connected;

  } else {

    document.getElementById('target-name').innerText =
      'None selected';

    sendBtn.disabled = true;
  }
}


async function performSearch() {

  const query =
    document.getElementById('search-input')
      .value
      .trim();

  if (!query) return;


  const resList =
    document.getElementById('search-results');

  resList.innerHTML =
    '<li>Searching...</li>';

  resList.classList.remove('hidden');


  try {

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`
    );

    const data = await res.json();

    resList.innerHTML = '';


    if (!data.length) {

      resList.innerHTML =
        '<li>No locations found</li>';

      return;
    }


    data.forEach((item) => {

      const li =
        document.createElement('li');

      li.innerText =
        item.display_name;


      li.addEventListener('click', () => {

        const lat =
          parseFloat(item.lat);

        const lon =
          parseFloat(item.lon);


        state.destination = {
          type: 'destination',
          lat: parseFloat(lat.toFixed(6)),
          lon: parseFloat(lon.toFixed(6)),
          label:
            item.display_name.split(',')[0]
        };


        MapController.setDestination(
          lat,
          lon,
          state.destination.label
        );


        MapController.map.setView(
          [lat, lon],
          15
        );


        resList.classList.add('hidden');

        updateUI();
      });


      resList.appendChild(li);
    });

  } catch (err) {

    console.error(err);

    resList.innerHTML =
      '<li>Error finding locations</li>';
  }
}
