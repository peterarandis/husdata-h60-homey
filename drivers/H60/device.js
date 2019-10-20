'use strict';

const Homey = require('homey');
const util = require('/lib/util.js');

class H60Device extends Homey.Device {

  onInit() {
    var interval = this.getSetting('polling') || 5;
    this.pollDevice(interval);
    this.setAvailable();
   this.log("onInit");
    // LISTENERS FOR UPDATING CAPABILITIES
   /* this.registerCapabilityListener('onoff', (value, opts) => {
      if (value) {
        return util.sendCommand('/relay/0?turn=on', this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
      } else {
        return util.sendCommand('/relay/0?turn=off', this.getSetting('address'), this.getSetting('username'), this.getSetting('password'));
      }
    });
   */	
  }

  onDeleted() {
    clearInterval(this.pollingInterval);
  }

  // HELPER FUNCTIONS
  pollDevice(interval) {
    clearInterval(this.pollingInterval);
    clearInterval(this.pingInterval);
    this.log("pollDevice " + this.getSetting('address'));
    this.pollingInterval = setInterval(() => {
      
	  util.sendCommand('/api/alldata', this.getSetting('address'))
	      .then(result => {
          //let temperature = result.['0001']; //Gives error: SyntaxError: Unexpected token [
		  
		  let temperature = 1; /// For test
		  
		  // capability measure_temperature
          if (temperature != this.getCapabilityValue('measure_temperature')) {
            this.setCapabilityValue('measure_temperature', temperature);
		  }
		  
		    // capability onoff  (This gives no errors)
          /*if (temperature != this.getCapabilityValue('onoff')) {
            this.setCapabilityValue('onoff', temperature);
          }
		  */
		  
          this.log("pollDevice result= " + temperature);  // Debuglog
          
		  })
        .catch(error => {
          this.log(error);
          this.setUnavailable(Homey.__('Unreachable'));
          this.pingDevice();
        })
    }, 1000 * interval);
  }

  pingDevice() {
    clearInterval(this.pollingInterval);
    clearInterval(this.pingInterval);
	this.log("pingDevice " + this.getSetting('address'));

    this.pingInterval = setInterval(() => {
      util.sendCommand('/status', this.getSetting('address'), this.getSetting('username'), this.getSetting('password'))
        .then(result => {
          this.setAvailable();
          var interval = this.getSetting('polling') || 5;
          this.pollDevice(interval);
        })
        .catch(error => {
          this.log('Device is not reachable, pinging every 63 seconds to see if it comes online again.');
        })
    }, 63000);
  }

}

module.exports = H60Device;
