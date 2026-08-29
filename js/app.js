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

let phoneHeading = null;

function startCompass() {
  window.addEventListener('deviceorientation', (event) => {
    if (typeof event.webkitCompassHeading === 'number') {
      phoneHeading = event.webkitCompassHeading;
    } else if (event.alpha !== null) {
      phoneHeading = (360 - event.alpha) % 360;
    }
  }, true);
}

document.addEventListener('DOMContentLoaded', () => {

  // MAP
  MapController.init((lat, lon) => {

    state.destination = {
      destination: {
        lat: parseFloat(lat.toFixed(6)),
        lon: parseFloat(lon.toFixed(6)),
        label: 'Selected Map Location'
      }
    };

    MapController.setDestination(
      lat,
      lon,
      state.destination.destination.label
    );

    updateUI();
  });


  // GPS
  GPS.start(

    async (data) => {

      state.gps = {
        ...state.gps,
        ...data,
        active: true
      };

      document
        .getElementById('gps-status-indicator')
        .className = 'status-tag on';

      document
        .getElementById('gps-status-indicator')
        .innerText = 'GPS ● ACTIVE';

      MapController.updateUserPosition(
        data.lat,
        data.lon
      );

      updateUI();


      // SEND GPS TO FIREBASE ONCE PER SECOND
      if (GPS.shouldSend()) {

        const success = await Device.send({
          gps: {
            lat: data.lat,
            lon: data.lon,
            accuracy: data.accuracy,
            heading: data.heading ?? null,
            speed: data.speed ?? null,
            timestamp: Date.now()
          }
        });

        if (!success) {
          document.getElementById('debug-log').innerText =
            'GPS upload failed';
        }
      }
    },

    (err) => {
      document.getElementById('debug-log').innerText =
        `GPS Error: ${err}`;
    }

  );


  // CONNECT CLOUD BUTTON
  document
    .getElementById('test-conn-btn')
    .addEventListener('click', () => {

      Device.connect(
        updateDeviceStatus,
        (msg) => {
          document.getElementById('debug-log').innerText = msg;
        }
      );

    });


  // SEARCH
  document
    .getElementById('search-btn')
    .addEventListener('click', performSearch);


  // SEND DESTINATION
  document
    .getElementById('send-btn')
    .addEventListener('click', async () => {

      if (!state.destination) {
        return;
      }

      const success = await Device.send(
        state.destination
      );

      if (success) {
        document.getElementById('debug-log').innerText =
          'Destination sent to ESP32 cloud link.';
      } else {
        document.getElementById('debug-log').innerText =
          'Destination upload failed.';
      }

    });


  // SERVICE WORKER
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(
      './service-worker.js'
    );
  }

});



function updateDeviceStatus(isConnected) {

  state.esp32.connected = isConnected;

  const tag =
    document.getElementById(
      'device-status-indicator'
    );

  if (isConnected) {

    tag.className = 'status-tag on';
    tag.innerText = 'CLOUD ● READY';

  } else {

    tag.className = 'status-tag off';
    tag.innerText = 'CLOUD ● OFFLINE';
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
      ? `${Math.round(state.gps.accuracy)}m`
      : '--';

  document.getElementById('val-spd').innerText =
    state.gps.speed !== null &&
    state.gps.speed !== undefined
      ? `${state.gps.speed.toFixed(1)} m/s`
      : '--';


  const sendBtn =
    document.getElementById('send-btn');


  if (state.destination) {

    const dest =
      state.destination.destination;

    document.getElementById('target-name').innerText =
      `${dest.label} (${dest.lat}, ${dest.lon})`;

    sendBtn.disabled = false;

  } else {

    sendBtn.disabled = true;
  }
}



async function performSearch() {

  const query =
    document.getElementById('search-input').value;

  if (!query) return;


  const resList =
    document.getElementById('search-results');

  resList.innerHTML = '<li>Searching...</li>';
  resList.classList.remove('hidden');


  try {

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );

    const data =
      await response.json();

    resList.innerHTML = '';


    data.slice(0, 5).forEach((item) => {

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
          destination: {
            lat: lat,
            lon: lon,
            label:
              item.display_name
                .split(',')[0]
          }
        };


        MapController.setDestination(
          lat,
          lon,
          state.destination.destination.label
        );


        resList.classList.add('hidden');

        updateUI();

      });


      resList.appendChild(li);

    });

  } catch (error) {

    console.error(error);

    resList.innerHTML =
      '<li>Error finding locations</li>';
  }
}
