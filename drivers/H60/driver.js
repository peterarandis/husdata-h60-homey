'use strict';

const Homey = require('homey');

class H60Driver extends Homey.Driver {

  onInit() {
    this.flowCards = {};
    this.registerFlows();
  }

  registerFlows() {
    this.log('Registering flows');

    // Triggers
    this.flowCards.outdoor_temp_changed = this.homey.flow.getDeviceTriggerCard('outdoor_temp_changed');
    this.flowCards.indoor_temp_changed = this.homey.flow.getDeviceTriggerCard('indoor_temp_changed');
    this.flowCards.warm_water_temp_changed = this.homey.flow.getDeviceTriggerCard('warm_water_temp_changed');
    this.flowCards.alarm_state_changed = this.homey.flow.getDeviceTriggerCard('alarm_state_changed');
    this.flowCards.additional_heat_changed = this.homey.flow.getDeviceTriggerCard('additional_heat_changed');
    this.flowCards.switch_valve_state_changed = this.homey.flow.getDeviceTriggerCard('switch_valve_state_changed');
  }

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

  /**
   *
   * @param {string} flow Name of flow
   * @param {Object} tokens Object matching trigger tokens
   * @param {object} device Homey device
   */
  async triggerDeviceFlow(flow, tokens, device) {
    this.log(`[${device.getName()}] Triggering device flow '${flow}' with tokens`, tokens);
    try {
      const triggerCard = this.flowCards[flow];
      await triggerCard.trigger(device, tokens);
    } catch (e) {
      this.error(e);
    }
  }

}

module.exports = H60Driver;
