'use strict';

const Homey = require('homey');
const { sendCommand, getMapKeyByValue } = require('../../lib/util');

const DEBOUNCE_RATE = 500;

// REGO 1000
const cap30 = [
  /* eslint-disable no-multi-spaces */
  ['measure_temperature'],         ['0008'],
  ['target_temperature'],          ['0203'],
  ['measure_temperature.outdoor'], ['0007'],
  ['WARM_WATER_TEMP'],             ['0009'],
  ['RADIATOR_RETURN_TEMP'],        ['0001'],
  ['RADIATOR_FORWARD_TEMP'],       ['0002'],
  ['HEAT_CARRIER_RETURN_TEMP'],    ['0003'],
  ['HEAT_CARRIER_FORWARD_TEMP'],   ['0004'],
  ['BRINE_IN_TEMP'],               ['0005'],
  ['BRINE_OUT_TEMP'],              ['0006'],
  ['ADDITIONAL_HEATER_POWER'],     ['3104'],
  ['COMPRESSOR_STATE'],            ['1A01'],
  ['SWITCH_VALVE_STATE'],          ['1A07'],
  ['SUM_ALARM_STATE'],             ['1A20'],
  /* eslint-disable no-multi-spaces */
];

// REGO 600
const cap00 = [
  /* eslint-disable no-multi-spaces */
  ['measure_temperature'],         ['0008'],
  ['target_temperature'],          ['0203'],
  ['measure_temperature.outdoor'], ['0007'],
  ['WARM_WATER_TEMP'],             ['0009'], // Will rewrite to 000A(GT3x) if sensor missing (pos 7)
  ['RADIATOR_RETURN_TEMP'],        ['0001'],
  ['RADIATOR_FORWARD_TEMP'],       ['0002'],
  ['HEAT_CARRIER_RETURN_TEMP'],    ['0003'],
  ['HEAT_CARRIER_FORWARD_TEMP'],   ['0004'],
  ['BRINE_IN_TEMP'],               ['0005'],
  ['BRINE_OUT_TEMP'],              ['0006'],
  ['ADDITIONAL_HEATER_POWER'],     ['3104'],
  ['COMPRESSOR_STATE'],            ['1A01'],
  ['SWITCH_VALVE_STATE'],          ['1A07'],
  ['SUM_ALARM_STATE'],             ['1A20'],
  /* eslint-disable no-multi-spaces */
];

// REGO 2000
const cap10 = [
  /* eslint-disable no-multi-spaces */
  ['measure_temperature'],         ['0008'],
  ['target_temperature'],          ['0203'],
  ['measure_temperature.outdoor'], ['0007'],
  ['WARM_WATER_TEMP'],             ['0009'],
  ['RADIATOR_FORWARD_TEMP'],       ['0002'],
  ['HEAT_CARRIER_RETURN_TEMP'],    ['0003'],
  ['HEAT_CARRIER_FORWARD_TEMP'],   ['0004'],
  ['BRINE_IN_TEMP'],               ['0005'],
  ['BRINE_OUT_TEMP'],              ['0006'],
  ['ADDITIONAL_HEATER_POWER'],     ['3104'],
  ['COMPRESSOR_STATE'],            ['1A01'],
  ['SWITCH_VALVE_STATE'],          ['1A07'],
  ['SUM_ALARM_STATE'],             ['1A20'],
  ['WARM_WATER_MID_TEMP'],         ['000A'],
  ['HEATING_SETPOINT_TEMP'],       ['0107'],
  ['OUTPUT_POWER'],                ['9108'], // Ex: 4.7 kW
  ['COMPRESSOR_SPEED'],            ['3108'], // Ex: 53%
  ['EXTRA_WARM_WATER_STATE'],      ['1231'], // 0 (off), 1 (on)
  ['WARM_WATER_PROGRAM'],          ['2213'], // Ex 0 = Eco, 1 = Normal, 2 = Komfort?
  ['EXTERNAL_CONTROL'],            ['2233'], // 0, 1
  ['EXTERNAL_CONTROL_2'],          ['2234'], // 0, 1
  ['SUPPLIED_TOTAL_METER'],        ['5C51'], // Total energy supplied (for heating + hot water)
  ['SUPPLIED_HEATING_METER'],      ['5C52'],
  ['SUPPLIED_HOT_WATER_METER'],    ['5C53'],
  ['meter_power'],                 ['5C54'], // Total energy used (for heating + hot water including aux heating)
  ['COMPRESSOR_HEATING_METER'],    ['5C55'],
  ['COMPRESSOR_HOT_WATER_METER'],  ['5C56'],
  ['AUX_TOTAL_METER'],             ['5C57'],
  ['AUX_HEATING_METER'],           ['5C58'],
  ['AUX_HOT_WATER_METER'],         ['5C59'],
  // ['COMPRESSOR_RUNTIME'],         ['6C60'],
  // ['COMPRESSOR_STARTS'],          ['2C61'],
  /* eslint-disable no-multi-spaces */
];

/**
 * @typedef {Map<string, string>} CapabilityRegisters
 */

// NIBE EB100
const cap40 = [
  /* eslint-disable no-multi-spaces */
  ['measure_temperature'],         ['0008'],
  ['target_temperature'],          ['0203'],
  ['measure_temperature.outdoor'], ['0007'],
  ['WARM_WATER_TEMP'],             ['0009'],
  ['RADIATOR_FORWARD_TEMP'],       ['0002'],
  ['HEAT_CARRIER_RETURN_TEMP'],    ['0003'],
  ['HEAT_CARRIER_FORWARD_TEMP'],   ['0004'],
  ['BRINE_IN_TEMP'],               ['0005'],
  ['BRINE_OUT_TEMP'],              ['0006'],
  ['ADDITIONAL_HEATER_POWER'],     ['3104'],
  ['COMPRESSOR_STATE'],            ['1A01'],
  ['SWITCH_VALVE_STATE'],          ['1A07'],
  ['SUM_ALARM_STATE'],             ['2A20'],
  /* eslint-disable no-multi-spaces */
];

class H60Device extends Homey.Device {

  async getCableType() {
    const address = this.getSetting('address');
    if (!this.H60_Cable) {
      const result = await sendCommand('/status', address);
      // this.log('RESULT', result);
      this.H1_Ver = result.status.H1ver; // Read H1 Version from H60 status request JSON string
      this.H60_Cable = this.H1_Ver.substring(0, 2); // Cable type
      if (this.H60_Cable === '30') {
        this.cap = cap30;
      } else if (this.H60_Cable === '10') {
        this.cap = cap10;
      } else if (this.H60_Cable === '40') {
        this.cap = cap40;
      } else {
        this.cap = cap00;
      }

      // Construct regular map from the odd array format, old format is deprecated
      this.cap.forEach((value, index) => {
        if (index % 2 === 0) {
          this.capAsMap.set(value[0], this.cap[index + 1][0]);
        }
      });

      this.log(`H60 H1 ver: ${this.H1_Ver} cable=${this.H60_Cable}`);
    }
  }

  async onInit() {
    this.blockPollWhileSettingRegister = false;
    const interval = this.getSetting('polling') || 10;

    this.log(`onInit - address: ${this.getSetting('address')}`);
    this.H60_Cable = '';
    this.H1_Ver = '';
    this.cap = '';
    /**
     * @type {CapabilityRegisters}
     */
    this.capAsMap = new Map();

    // Register capabilities setting
    this.registerMultipleCapabilityListener(
      ['target_temperature', 'EXTERNAL_CONTROL', 'EXTERNAL_CONTROL_2', 'EXTRA_WARM_WATER_STATE', 'WARM_WATER_PROGRAM'],
      (capabilityValues, capabilityOptions) => {
        Object.keys(capabilityValues).forEach(async (capabilityName) => {
          const value = capabilityValues[capabilityName];
          switch (capabilityName) {
            case 'target_temperature': {
              await this.onSetRegister('target_temperature', value * 10);
              break;
            }
            case 'EXTERNAL_CONTROL': {
              await this.onSetRegister('EXTERNAL_CONTROL', value ? '1' : '0');
              break;
            }
            case 'EXTERNAL_CONTROL_2': {
              await this.onSetRegister('EXTERNAL_CONTROL_2', value ? '1' : '0');
              break;
            }
            case 'EXTRA_WARM_WATER_STATE': {
              await this.onSetRegister('EXTRA_WARM_WATER_STATE',  value ? '1' : '0');
              break;
            }
            case 'WARM_WATER_PROGRAM': {
              await this.onSetRegister('WARM_WATER_PROGRAM', Number(value));
              break;
            }
            default:
              break;
          }
        });
        this.log('capabilityValues, capabilityOptions', capabilityValues, capabilityOptions);
      },
      DEBOUNCE_RATE,
    );

    await this.getCableType();

    // Add new capabilities for existing devices
    if (this.capAsMap) {
      const capabilityNames = Array.from(this.capAsMap.keys());
      await Promise.all(capabilityNames.map(async (capabilityName) => {
        try {
          if (!this.hasCapability(capabilityName)) {
            await this.addCapability(capabilityName);
          }
        } catch (e) {
          this.log(`Could not add capability "${capabilityName}"`);
        }
      }));
    }

    // Remove test capabilities and renamed capabilities
    if (this.hasCapability('ROOM_SET_TEMP')) {
      try {
        await this.removeCapability('ROOM_SET_TEMP');
      } catch (e) {}
    }
    if (this.hasCapability('INDOOR_TEMP')) {
      try {
        await this.removeCapability('INDOOR_TEMP');
      } catch (e) {}
    }
    if (this.hasCapability('OUTDOOR_TEMP')) {
      try {
        await this.removeCapability('OUTDOOR_TEMP');
      } catch (e) {}
    }
    if (this.hasCapability('measure_temperature.outside')) {
      try {
        await this.removeCapability('measure_temperature.outside');
      } catch (e) {}
    }

    const caps = this.getCapabilities();
    this.log(caps);

    await this.pollDevice(interval);
    this.setAvailable();
  }

  onDeleted() {
    clearInterval(this.pollingInterval);
  }

  async poll() {
    const address = this.getSetting('address');

    if (!this.H60_Cable) {
      return;
    }

    const statusResult = await sendCommand('/status', address);
    try {
      const approximatedPower = statusResult.status.powersum;
      this.setCapabilityValue('measure_power', approximatedPower);
    } catch (error) {
      this.log(error);
      this.setUnavailable(this.homey.__('Unreachable'));
      this.pingDevice();
      return;
    }

    try {
      // this.log(`pollDevice ${address} hp type: ${this.H60_Cable}`);
      if (this.blockPollWhileSettingRegister) {
        return;
      }

      const result = await sendCommand('/api/homey', address);

      if (this.blockPollWhileSettingRegister) {
        return;
      }

      // Handle only the values that Husdata gave us
      const keys = Object.keys(result);
      keys.forEach(async (key) => {
        let v = result[key] || 0;
        const register = key.substring(1); // X1234 -> 1234
        const capabilityName = getMapKeyByValue(this.capAsMap, register);
        // Skip values that we don't have Homey capabilities for
        if (!capabilityName) {
          return;
        }

        if (!capabilityName.toLowerCase().includes('meter') && v > 60000) {
          // Recalc if Negative
          v -= 65536;
        }
        if (v == 32758) v = 0; // Sensor not installed EB100

        // Extract value type (temp, %, kw, status, etc-)
        const d = String(register).substring(0, 1);

        // Divide by 10 if TEMP , % or kW (or kWh since late 2022 or early 2023)
        if (capabilityName === 'WARM_WATER_PROGRAM' || d === '0' || d === '3' || d === '5' || d === '9') {
          v /= 10;
        }

        if (capabilityName === 'OUTPUT_POWER') {
          v = Math.round(v * 1000);
        }

        if (capabilityName === 'WARM_WATER_TEMP' && v === -48.3) {
          // Special for Rego600 that can have internal GT3 tank or External GT3x
          cap00[7] = '000A'; // Reset variable on position 7
          v = 0; // Not to show -48.3 at startup
          this.log('Switched from reading GT3 to GT3x for Rego600');
        }

        // Convert 0/1 to bool
        if ([
          'EXTRA_WARM_WATER_STATE',
          'EXTERNAL_CONTROL',
          'EXTERNAL_CONTROL_2',
        ].includes(capabilityName)) {
          v = v === 1;
        }

        // Convert number to string for enums
        // No enum capabilities at this time

        // If indoor temperature is 0, assume there is no sensor and set the value to null
        // so that Homey doesn't think it's actually 0 degrees inside.
        if (capabilityName === 'measure_temperature' && v === 0) {
          v = null;
        }

        if (v != this.getCapabilityValue(capabilityName)) {
          this.setCapabilityValue(capabilityName, v); // Set in app
          this.log(`set:${this.H60_Cable}  ${capabilityName} = ${v}`);

          // Trigger sub capabilities changed event, since sub caps are not auto triggered by Homey.
          // Trigger When cards that do not follow the recommended naming scheme for auto trigger
          // TODO use a map between cap name and trigger name, loop over that instead?
          if (capabilityName === 'measure_temperature.outdoor') {
            await this.driver.triggerDeviceFlow(
              'measure_temperature_outdoor_changed',
              { measure_temperature_outdoor_changed: v },
              this,
            );
          }
          if (capabilityName === 'WARM_WATER_TEMP') {
            await this.driver.triggerDeviceFlow(
              'warm_water_temp_changed',
              { warm_water_temp_changed: v },
              this,
            );
          }
          if (capabilityName === 'SUM_ALARM_STATE') {
            await this.driver.triggerDeviceFlow(
              'alarm_state_changed',
              { alarm_state_changed: v },
              this,
            );
          }
          if (capabilityName === 'ADDITIONAL_HEATER_POWER') {
            await this.driver.triggerDeviceFlow(
              'additional_heat_changed',
              { additional_heat_changed: v },
              this,
            );
          }
          if (capabilityName === 'SWITCH_VALVE_STATE') {
            await this.driver.triggerDeviceFlow(
              'switch_valve_state_changed',
              { switch_valve_state_changed: v },
              this,
            );
          }

          // OUTPUT_POWER_changed trigger is automatically triggered when capability
          // value OUTPUT_POWER is set using this.setCapabilityValue due to naming convention.
        }
      });
    } catch (error) {
      this.log('POLL DATA ERROR', error);
      this.setUnavailable(this.homey.__('Unreachable'));
      this.pingDevice();
    }
  }

  async pollDevice(interval) {
    this.log('pollDevice', interval);
    clearInterval(this.pollingInterval);
    clearInterval(this.pingInterval);
    this.pollingInterval = this.homey.setInterval(() => this.poll(), 1000 * interval);
    await this.poll();
  }

  async onSetRegister(capabilityName, value) {
    this.blockPollWhileSettingRegister = true;
    try {
      const register = this.capAsMap.get(capabilityName);
      if (!register) {
        return;
      }
      this.log(`Setting ${capabilityName} in register ${register} to ${value}`);
      const result = await sendCommand(`/api/set?idx=${register}&val=${value}`, this.getSetting('address'));
      this.log(`response H60: ${result.response}`);
      // Wait a bit, husdata responds OK immediately but keeps responding with old value for a long unknown time
      await new Promise((resolve) => setTimeout(resolve, 6000));
    } catch (error) {
      this.log(error);
      this.setUnavailable(this.homey.__('Unreachable'));
      this.pingDevice();
    }
    this.blockPollWhileSettingRegister = false;
  }

  pingDevice() {
    this.homey.clearInterval(this.pollingInterval);
    this.homey.clearInterval(this.pingInterval);
    this.log(`pingDevice ${this.getSetting('address')}`);

    this.pingInterval = setInterval(() => {
      sendCommand(
        '/status',
        this.getSetting('address'),
      )
        .then((result) => {
          this.setAvailable();
          const interval = this.getSetting('polling') || 5;
          this.pollDevice(interval);
        })
        .catch((error) => {
          this.log(
            'Device is not reachable, pinging every 63 seconds to see if it comes online again.',
          );
        });
    }, 63000);
  }

}

module.exports = H60Device;
