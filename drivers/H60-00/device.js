'use strict';

const Homey = require('homey');
const util = require('/lib/util.js');
const DEBOUNCE_RATE = 500;
//const Cap    = require('./cap');
var H60_Cable = "";
var H1_Ver = "";

class H60Device extends Homey.Device {

/*
  // Set a capability value, optionally formatting it.
  async setValue(cap, value) {
    if (value == null) return;
    if (typeof value === 'number') {
      value = formatValue(value);
    }
    if (this.getCapabilityValue(cap) !== value) {
      await this.setCapabilityValue(cap, value).catch(e => {
        this.log(`Unable to set capability '${ cap }': ${ e.message }`);
      });
    }
  }
*/

 
  onInit() {
    var interval = this.getSetting('polling') || 5;
	
    this.pollDevice(interval);
    this.setAvailable();
    this.log("onInit - address: " + this.getSetting('address'));   
	    
    // Register capabilities setting
	this.registerMultipleCapabilityListener([ 'target_temperature' ],     this.onSetTargetTemperature.bind(this), DEBOUNCE_RATE);
	//this.registerMultipleCapabilityListener([ 'target_temperature.outdoor' ],     this.onSetTargetTemperature.bind(this), DEBOUNCE_RATE);
	
	new Homey.FlowCardTriggerDevice('outdoor_temp_changed').register();     // register flow triggers
	new Homey.FlowCardTriggerDevice('additional_heat_changed').register();     // register flow triggers
    }

  onDeleted() {
    clearInterval(this.pollingInterval);
  }

  // HELPER FUNCTIONS
  pollDevice(interval) {
    clearInterval(this.pollingInterval);
    clearInterval(this.pingInterval);
    
    this.pollingInterval = setInterval(() => {
      
	  if (H60_Cable == "")
		    util.sendCommand('/status', this.getSetting('address')) // H60 Status request
		  .then(result => {
					H1_Ver = String(result.status.H1ver); // Read H1 Version from H60 status request JSON string
					H60_Cable = H1_Ver.substring(0,2); // Cable type
					this.log('H60 H1 ver: ' + H1_Ver + " cable=" + H60_Cable);
			})


	  //this.log("pollDevice " + this.getSetting('address') + " hp type: " + H60_Cable );
	  util.sendCommand('/api/homey', this.getSetting('address'))
	      .then(result => {
      
		  var cap = [];
		  var v = [];
		  var t = [];
		  if (H60_Cable == "30")
			{   // REGO 1000 
				var last=10;
				//v[0] = result.X0001;  t[0]=0;  cap[0] = 'RADIATOR_RETURN_TEMP' ; // Radiator return temp 
				v[1] = result.X0002;  t[1]=0;  cap[1] = 'RADIATOR_FORWARD_TEMP' ; // Radiator forward temp
				v[2] = result.X0005;  t[2]=0;  cap[2] = 'BRINE_IN_TEMP' ; // Brine In
				v[3] = result.X0006;  t[3]=0;  cap[3] = 'BRINE_OUT_TEMP' ; // Brine Out
				v[4] = result.X0007;  t[4]=0;  cap[4] = 'OUTDOOR_TEMP' ; // Outdoor temp
				v[5] = result.X0009;  t[5]=0;  cap[5] = 'WARM_WATER_TEMP' ; // Warm water temp
				v[6] = result.X3104;  t[6]=3;  cap[6] = 'ADDITIONAL_HEATER_POWER' ; // Add heat status %
				v[7] = result.X1A04;  t[7]=1;  cap[7] = 'COMPRESSOR_STATE' ; // Compressor status
				v[8] = result.X1A07;  t[8]=1;  cap[8] = 'SWITCH_VALVE_STATE' ; // Switch valve status
				v[9] = result.X1A20;  t[9]=1;  cap[9] = 'SUM_ALARM_STATE' ; // Sum alarm
			   v[10] = result.X0203; t[10]=0; cap[10] = 'ROOM_TEMP' ; // Indoor temp setting
			}  
			else if (H60_Cable == "00")
				{ // REGO 600 
				var last=10;
				v[0] = result.X0001;  t[0]=0;  cap[0] = 'RADIATOR_RETURN_TEMP' ; // Radiator return temp 
				v[1] = result.X0002;  t[1]=0;  cap[1] = 'RADIATOR_FORWARD_TEMP' ; // Radiator forward temp
				v[2] = result.X0005;  t[2]=0;  cap[2] = 'BRINE_IN_TEMP' ; // Brine In
				v[3] = result.X0006;  t[3]=0;  cap[3] = 'BRINE_OUT_TEMP' ; // Brine Out
				v[4] = result.X0007;  t[4]=0;  cap[4] = 'OUTDOOR_TEMP' ; // Outdoor temp
				v[5] = result.X0009;  t[5]=0;  cap[5] = 'WARM_WATER_TEMP' ; // Warm water temp
				v[6] = result.X3104;  t[6]=3;  cap[6] = 'ADDITIONAL_HEATER_POWER' ; // Add heat status %
				v[7] = result.X1A04;  t[7]=1;  cap[7] = 'COMPRESSOR_STATE' ; // Compressor status
				v[8] = result.X1A07;  t[8]=1;  cap[8] = 'SWITCH_VALVE_STATE' ; // Switch valve status
				v[9] = result.X1A20;  t[9]=1;  cap[9] = 'SUM_ALARM_STATE' ; // Sum alarm
			   v[10] = result.X0203; t[10]=0; cap[10] = 'ROOM_TEMP' ; // Indoor temp setting
			}  
		    else
			   this.log('Error H60 Cable not defined: " ' + H60_Cable);
		  
		  
		  for (var i=0;i<last+1;i++) {
			     if(v[i]>60000) v[i]=v[i]-65536; // Negative
				 if (v[i] != 0 && (t[i] =='0' || t[i] =='3')) 	 v[i] = v[i]  / 10;	 // Temp and % devide by 10
		    }  
		  
		  for (var i=0;i<last+1;i++) {
			if (v[i] != this.getCapabilityValue(cap[i])) 
			      { this.setCapabilityValue(cap[i], v[i]);  }
			
			if(cap[i] == 'OUTDOOR_TEMP') 			{Homey.ManagerFlow.getCard('trigger', 'outdoor_temp_changed').trigger(this, {temperature: v[i]}, {})  }
			if(cap[i] == 'ADDITIONAL_HEATER_POWER') {Homey.ManagerFlow.getCard('trigger', 'additional_heat_changed').trigger(this, {power: v[i]}, {})  }	
			if(cap[i] == 'ROOM_TEMP') 				{this.setCapabilityValue('target_temperature', v[10]); } // termostat		
			
		  
			}
		
			
			  		  
		}
	)
		  
        .catch(error => {
          this.log(error);
          this.setUnavailable(Homey.__('Unreachable'));
          this.pingDevice();
        })
    }, 1000 * interval);
  }

  async onSetTargetTemperature(data, opts) {
    //let value = data[Capabilities.TARGET_TEMP];
	let value = data['target_temperature'];
    this.log('setting target temperature to', value);
    value=value*10;
	util.sendCommand('/api/set?idx=0203&val=' + value, this.getSetting('address'))
	  .then(result => {
		  this.log('response H60: ' + result.response);
		  
	  })
	  
	  
	.catch(error => {
          this.log(error);
          this.setUnavailable(Homey.__('Unreachable'));
          this.pingDevice();
        })
		
    // Retrieve current target temperature from backend.
    /*let status = await this.client.status();
    let currentValue = formatValue(status[ status['user mode'] === 'manual' ? 'temp manual setpoint' : 'temp setpoint' ]);

    if (currentValue === value) {
      this.log('(value matches current, not updating)');
      // Check if capability value matches.
      if (this.getCapabilityValue(Capabilities.TARGET_TEMP) !== value) {
        await this.setValue(Capabilities.TARGET_TEMP, value);
      }
      return true;
    }

    return this.client.setTemperature(value).then(s => {
      this.log('...status:', s.status);
      if (s.status === 'ok') {
        return this.setValue(Capabilities.TARGET_TEMP, value);
      }
    });
*/	
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
