const Storage = {
  getESPAddress() {
    return localStorage.getItem('esp32_address') || '';
  },
  setESPAddress(address) {
    localStorage.setItem('esp32_address', address);
  }
};