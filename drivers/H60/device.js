'use strict';

const Homey = require('homey');
const util = require('/lib/util.js');

class H60Device extends Homey.Device {

  onInit() {
    var interval = this.getSetting('polling') || 5;
    this.pollDevice(interval);
    this.setAvailable();
    this.log("Polliing - address: " + this.getSetting('address'));   
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
      
	  //this.log("fetch: " + 'http://'+ this.getSetting('address') + '/api/alldata')
	  util.sendCommand('/api/homey', this.getSetting('address'))
	      .then(result => {
          
		  var cap = [];
		  var v = [];
		  var last=9;
		  v[0] = result.X0001;  cap[0] = 'cap_0001' ; // Radiator return temp 
		  v[1] = result.X0002;  cap[1] = 'cap_0002' ; // Radiator forward temp
		  v[2] = result.X0005;  cap[2] = 'cap_0005' ; // Brine In
		  v[3] = result.X0006;  cap[3] = 'cap_0006' ; // Brine Out
		  v[4] = result.X0007;  cap[4] = 'cap_0007' ; // Outdoor temp
		  v[5] = result.X0009;  cap[5] = 'cap_0009' ; // Warm water temp
		  v[6] = result.X3104;  cap[6] = 'cap_3104' ; // Add heat status %
		  v[7] = result.X1A04;  cap[7] = 'cap_1A04' ; // Compressor status
		  v[8] = result.X1A07;  cap[8] = 'cap_1A07' ; // Switch valve status
		  v[9] = result.X1A20;  cap[9] = 'cap_1A20' ; // Sum alarm
		  
		  
		  
		  for (var i=0;i<last+1;i++) {
			     if(v[i]>60000) v[i]=v[i]-65536; // Negative
				 if (v[i] != 0 && (cap[i].substring(4,5) =='0' || cap[i].substring(4,5) =='3')) 	 v[i] = v[i]  / 10;	 // Temp and % devide by 10
		    }  
		  
		  for (var i=0;i<last+1;i++) {
			if (v[i] != this.getCapabilityValue(cap[i])) 
			      { this.setCapabilityValue(cap[i], v[i]);  }
		  }
		    
			  		  
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
