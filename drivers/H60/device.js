'use strict';

const Homey = require('homey');
const util = require('../../lib/util');

const DEBOUNCE_RATE = 500;

// REGO 1000
// eslint-disable-next-line camelcase
const cap_30 = [
  /* eslint-disable no-multi-spaces */
  ['INDOOR_TEMP'],                ['0008'],
  ['ROOM_SET_TEMP'],              ['0203'],
  ['OUTDOOR_TEMP'],               ['0007'],
  ['WARM_WATER_TEMP'],            ['0009'],
  ['RADIATOR_RETURN_TEMP'],       ['0001'],
  ['RADIATOR_FORWARD_TEMP'],      ['0002'],
  ['HEAT_CARRIER_RETURN_TEMP'],   ['0003'],
  ['HEAT_CARRIER_FORWARD_TEMP'],  ['0004'],
  ['BRINE_IN_TEMP'],              ['0005'],
  ['BRINE_OUT_TEMP'],             ['0006'],
  ['ADDITIONAL_HEATER_POWER'],    ['3104'],
  ['COMPRESSOR_STATE'],           ['1A01'],
  ['SWITCH_VALVE_STATE'],         ['1A07'],
  ['SUM_ALARM_STATE'],            ['1A20'],
  ['eof'], ['eof'],
  /* eslint-disable no-multi-spaces */
];

// REGO 600
// eslint-disable-next-line camelcase
const cap_00 = [
  /* eslint-disable no-multi-spaces */
  ['INDOOR_TEMP'],               ['0008'],
  ['ROOM_SET_TEMP'],             ['0203'],
  ['OUTDOOR_TEMP'],              ['0007'],
  ['WARM_WATER_TEMP'],           ['0009'], // Will rewrite to 000A(GT3x) if sensor missing (pos 7)
  ['RADIATOR_RETURN_TEMP'],      ['0001'],
  ['RADIATOR_FORWARD_TEMP'],     ['0002'],
  ['HEAT_CARRIER_RETURN_TEMP'],  ['0003'],
  ['HEAT_CARRIER_FORWARD_TEMP'], ['0004'],
  ['BRINE_IN_TEMP'],             ['0005'],
  ['BRINE_OUT_TEMP'],            ['0006'],
  ['ADDITIONAL_HEATER_POWER'],   ['3104'],
  ['COMPRESSOR_STATE'],          ['1A01'],
  ['SWITCH_VALVE_STATE'],        ['1A07'],
  ['SUM_ALARM_STATE'],           ['1A20'],
  ['eof'], ['eof'],
  /* eslint-disable no-multi-spaces */
];

// REGO 2000
// eslint-disable-next-line camelcase
const cap_10 = [
  /* eslint-disable no-multi-spaces */
  ['INDOOR_TEMP'],                ['0008'],
  ['ROOM_SET_TEMP'],              ['0203'],
  ['OUTDOOR_TEMP'],               ['0007'],
  ['WARM_WATER_TEMP'],            ['0009'],
  ['RADIATOR_FORWARD_TEMP'],      ['0002'],
  ['HEAT_CARRIER_RETURN_TEMP'],   ['0003'],
  ['HEAT_CARRIER_FORWARD_TEMP'],  ['0004'],
  ['BRINE_IN_TEMP'],              ['0005'],
  ['BRINE_OUT_TEMP'],             ['0006'],
  ['ADDITIONAL_HEATER_POWER'],    ['3104'],
  ['COMPRESSOR_STATE'],           ['1A01'],
  ['SWITCH_VALVE_STATE'],         ['1A07'],
  ['SUM_ALARM_STATE'],            ['1A20'],
  ['eof'], ['eof'],
  /* eslint-disable no-multi-spaces */
];
// NIBE EB100
// eslint-disable-next-line camelcase
const cap_40 = [
  /* eslint-disable no-multi-spaces */
  ['INDOOR_TEMP'],                ['0008'],
  ['ROOM_SET_TEMP'],              ['0203'],
  ['OUTDOOR_TEMP'],               ['0007'],
  ['WARM_WATER_TEMP'],            ['0009'],
  ['RADIATOR_FORWARD_TEMP'],      ['0002'],
  ['HEAT_CARRIER_RETURN_TEMP'],   ['0003'],
  ['HEAT_CARRIER_FORWARD_TEMP'],  ['0004'],
  ['BRINE_IN_TEMP'],              ['0005'],
  ['BRINE_OUT_TEMP'],             ['0006'],
  ['ADDITIONAL_HEATER_POWER'],    ['3104'],
  ['COMPRESSOR_STATE'],           ['1A01'],
  ['SWITCH_VALVE_STATE'],         ['1A07'],
  ['SUM_ALARM_STATE'],            ['2A20'],
  ['eof'], ['eof'],
  /* eslint-disable no-multi-spaces */
];

class H60Device extends Homey.Device {

  onInit() {
    const interval = this.getSetting('polling') || 10;
    this.pollDevice(interval);
    this.setAvailable();
    this.log(`onInit - address: ${this.getSetting('address')}`);
    this.H60_Cable = '';
    this.H1_Ver = '';
    this.cap = '';

    // Register capabilities setting
    this.registerMultipleCapabilityListener(
      ['target_temperature'],
      this.onSetTargetTemperature.bind(this),
      DEBOUNCE_RATE,
    );
    // this.registerMultipleCapabilityListener([ 'target_temperature.outdoor' ],     this.onSetTargetTemperature.bind(this), DEBOUNCE_RATE);
  }

  onDeleted() {
    clearInterval(this.pollingInterval);
  }

  async poll() {
    const address = this.getSetting('address');

    if (!this.H60_Cable) {
      const result = await util.sendCommand('/status', address);
      // this.log('RESULT', result);
      this.H1_Ver = result.status.H1ver; // Read H1 Version from H60 status request JSON string
      this.H60_Cable = this.H1_Ver.substring(0, 2); // Cable type
      if (this.H60_Cable == '30') this.cap = cap_30;
      else if (this.H60_Cable == '10') this.cap = cap_10;
      else if (this.H60_Cable == '40') this.cap = cap_40;
      else this.cap = cap_00;

      this.log(`H60 H1 ver: ${this.H1_Ver} cable=${this.H60_Cable}`);
      return;
    }

    try {
      // this.log(`pollDevice ${address} hp type: ${this.H60_Cable}`);
      const result = await util.sendCommand('/api/homey', address);
      // this.log('RESULT', result);
      let v = 0;
      let j = 0;

      while (this.cap[j] != 'eof') {
        v = result[`X${this.cap[j + 1]}`]; // Set new value from H60 Json response

        if (v > 60000) v -= 65536; // Recalc if Negative
        if (v == 32758) v = 0; // Sensor not installet EB100
        const d = String(this.cap[j + 1]).substring(0, 1); // Extract value type (temp, %, kw, status, etc-)
        if (v != 0 && (d == '0' || d == '3' || d == '9')) v /= 10; // Devide by 10 if TEMP , % or kW

        if (this.cap[j] == 'WARM_WATER_TEMP' && v == -48.3) {
          // Special for Rego600 that can have internal GT3 tank or External GT3x
          cap_00[7] = '000A'; // Reset variable on position 7
          v = 0; // Not to show -48.3 at startup
          this.log('Switched from reading GT3 to GT3x for Rego600');
        }

        if (v != this.getCapabilityValue(this.cap[j])) {
          // Has value changed
          this.setCapabilityValue(String(this.cap[j]), v); // Set in app
          this.log(`set:${this.H60_Cable}  ${this.cap[j]} = ${v}`);

          if (this.cap[j] === 'OUTDOOR_TEMP') {
            await this.driver.triggerDeviceFlow(
              'outdoor_temp_changed',
              { outdoor_temp_changed: v },
              this,
            );
          }
          if (this.cap[j] === 'INDOOR_TEMP') {
            await this.driver.triggerDeviceFlow(
              'indoor_temp_changed',
              { indoor_temp_changed: v },
              this,
            );
          }
          if (this.cap[j] === 'WARM_WATER_TEMP') {
            await this.driver.triggerDeviceFlow(
              'warm_water_temp_changed',
              { warm_water_temp_changed: v },
              this,
            );
          }
          if (this.cap[j] === 'SUM_ALARM_STATE') {
            await this.driver.triggerDeviceFlow(
              'alarm_state_changed',
              { alarm_state_changed: v },
              this,
            );
          }
          if (this.cap[j] === 'ADDITIONAL_HEATER_POWER') {
            await this.driver.triggerDeviceFlow(
              'additional_heat_changed',
              { additional_heat_changed: v },
              this,
            );
          }
          if (this.cap[j] === 'SWITCH_VALVE_STATE') {
            await this.driver.triggerDeviceFlow(
              'switch_valve_state_changed',
              { switch_valve_state_changed: v },
              this,
            );
          }

          // Thermostat
          if (this.cap[j] === 'ROOM_SET_TEMP') {
            this.setCapabilityValue('target_temperature', v);
          }
        }

        j += 2; // Next value / index
      }
    } catch (error) {
      this.log(error);
      this.setUnavailable(Homey.__('Unreachable'));
      this.pingDevice();
    }
  }

  pollDevice(interval) {
    this.log('pollDevice', interval);
    clearInterval(this.pollingInterval);
    clearInterval(this.pingInterval);
    this.pollingInterval = this.homey.setInterval(() => this.poll(), 1000 * interval);
    this.poll();
  }

  async onSetTargetTemperature(data, opts) {
    let value = data['target_temperature'];
    this.log('setting target temperature to', value);
    value *= 10;
    util
      .sendCommand(`/api/set?idx=0203&val=${value}`, this.getSetting('address'))
      .then((result) => {
        this.log(`response H60: ${result.response}`);
      })

      .catch((error) => {
        this.log(error);
        this.setUnavailable(Homey.__('Unreachable'));
        this.pingDevice();
      });
  }

  pingDevice() {
    clearInterval(this.pollingInterval);
    clearInterval(this.pingInterval);
    this.log(`pingDevice ${this.getSetting('address')}`);

    this.pingInterval = setInterval(() => {
      util
        .sendCommand(
          '/status',
          this.getSetting('address'),
          this.getSetting('username'),
          this.getSetting('password'),
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
