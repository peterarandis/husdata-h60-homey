'use strict';

const Homey = require('homey');

class H60Driver extends Homey.Driver {

  async onPair(session) {
    this.log('Pairing started...');
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();
    let selectedDeviceId;
    const devicesArray = {};
    let deviceArray = {};

    session.setHandler('list_devices', (data) => {
      const devices = Object.values(discoveryResults).map((discoveryResult) => {
        this.log(`Found device: ${discoveryResult.address} ${discoveryResult.id}`);
        // push discovered device to temporary array with all discovered devices
        devicesArray[discoveryResult.id] = {
          name: `H60 [${discoveryResult.address}]`,
          data: {
            id: discoveryResult.id,
          },
          settings: {
            address: discoveryResult.address,
          },
        };

        return {
          name: `H60 [${discoveryResult.address}]`,
          data: {
            id: discoveryResult.id,
          },
        };
      });
      return devices;
    });

    // Lists discovered devices
    session.setHandler('list_devices_selection', (data) => {
      selectedDeviceId = data[0].data.id;
      this.log(`Selected device: ${selectedDeviceId}`);
      // push the selected device to a temporary array which can be used for pairing
      deviceArray = devicesArray[selectedDeviceId];
    });

    session.setHandler('get_device', () => {
      this.log('get_device done ');
      return deviceArray;
    });
  }

}

module.exports = H60Driver;
