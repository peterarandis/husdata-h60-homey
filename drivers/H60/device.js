'use strict';

const Homey = require('homey');
const util = require('/lib/util.js');
const DEBOUNCE_RATE = 500;


// REGO 1000
let cap_30 =[["INDOOR_TEMP"],					["0008"],
			 ["ROOM_SET_TEMP"],					["0203"],
			 ["OUTDOOR_TEMP"],					["0007"], 
			 ["WARM_WATER_TEMP"],				["0009"],
			 ["RADIATOR_RETURN_TEMP"],			["0001"],
			 ["RADIATOR_FORWARD_TEMP"],			["0002"],
			 ["HEAT_CARRIER_RETURN_TEMP"], 		["0003"],
			 ["HEAT_CARRIER_FORWARD_TEMP"],		["0004"],
			 ["BRINE_IN_TEMP"],					["0005"],
			 ["BRINE_OUT_TEMP"],				["0006"], 
			 ["ADDITIONAL_HEATER_POWER"],		["3104"],
			 ["COMPRESSOR_STATE"],				["1A04"],
			 ["SWITCH_VALVE_STATE"],			["1A07"], 
			 ["SUM_ALARM_STATE"],				["1A20"],
			 
			 ["eof"],["eof"]
		  		  		  
		  ]

// REGO 600
let cap_00 =[["INDOOR_TEMP"],					["0008"],
			 ["ROOM_SET_TEMP"],					["0203"],
			 ["OUTDOOR_TEMP"],					["0007"], 
			 ["WARM_WATER_TEMP"],				["0009"],
			 ["RADIATOR_RETURN_TEMP"],			["0001"],
			 ["RADIATOR_FORWARD_TEMP"],			["0002"],
			 ["HEAT_CARRIER_RETURN_TEMP"], 		["0003"],
			 ["HEAT_CARRIER_FORWARD_TEMP"],		["0004"],
			 ["BRINE_IN_TEMP"],					["0005"],
			 ["BRINE_OUT_TEMP"],				["0006"], 
			 ["ADDITIONAL_HEATER_POWER"],		["3104"],
			 ["COMPRESSOR_STATE"],				["1A04"],
			 ["SWITCH_VALVE_STATE"],			["1A07"], 
			 ["SUM_ALARM_STATE"],				["1A20"],
			 ["eof"],["eof"]
		  		  		  
		  ]

		  // REGO 2000
let cap_10 =[["INDOOR_TEMP"],					["0008"],
			 ["ROOM_SET_TEMP"],					["0203"],
			 ["OUTDOOR_TEMP"],					["0007"], 
			 ["WARM_WATER_TEMP"],				["0009"],
			 ["RADIATOR_FORWARD_TEMP"],			["0002"],
			 ["HEAT_CARRIER_RETURN_TEMP"], 		["0003"],
			 ["HEAT_CARRIER_FORWARD_TEMP"],		["0004"],
			 ["BRINE_IN_TEMP"],					["0005"],
			 ["BRINE_OUT_TEMP"],				["0006"], 
			 ["ADDITIONAL_HEATER_POWER"],		["3104"],
			 ["COMPRESSOR_STATE"],				["1A04"],
			 ["SWITCH_VALVE_STATE"],			["1A07"], 
			 ["SUM_ALARM_STATE"],				["1A20"],
			 ["eof"],["eof"]
		  		  		  
		  ]


  
											 
class H60Device extends Homey.Device {
  
	
  onInit() {
    var interval = this.getSetting('polling') || 10;
	this.pollDevice(interval);
    this.setAvailable();
    this.log("onInit - address: " + this.getSetting('address'));   
	this.H60_Cable = "";
	this.H1_Ver = "";
	this.cap = "";
	
	    
    // Register capabilities setting
	this.registerMultipleCapabilityListener([ 'target_temperature' ],     this.onSetTargetTemperature.bind(this), DEBOUNCE_RATE);
	//this.registerMultipleCapabilityListener([ 'target_temperature.outdoor' ],     this.onSetTargetTemperature.bind(this), DEBOUNCE_RATE);
	
	// register flow triggers
	new Homey.FlowCardTriggerDevice('outdoor_temp_changed').register();   
	new Homey.FlowCardTriggerDevice('indoor_temp_changed').register();    
	new Homey.FlowCardTriggerDevice('warm_water_temp_changed').register();    
	new Homey.FlowCardTriggerDevice('alarm_state_changed').register();    
	new Homey.FlowCardTriggerDevice('switch_valve_state_changed').register();    
	new Homey.FlowCardTriggerDevice('additional_heat_changed').register();
    }

  onDeleted() {
    clearInterval(this.pollingInterval);
  }

  // HELPER FUNCTIONS
  pollDevice(interval) {
    clearInterval(this.pollingInterval);
    clearInterval(this.pingInterval);
    
    this.pollingInterval = setInterval(() => {
      
	if (this.H60_Cable == "")
	  {
		    util.sendCommand('/status', this.getSetting('address')) // H60 Status request
		  .then(result => {
					this.H1_Ver = result.status.H1ver; // Read H1 Version from H60 status request JSON string
					this.H60_Cable = this.H1_Ver.substring(0,2); // Cable type
					if (this.H60_Cable == "30")	this.cap=cap_30;
					else if (this.H60_Cable == "10")  this.cap=cap_10;
					else  this.cap=cap_00;
					
					this.log('H60 H1 ver: ' + this.H1_Ver + " cable=" + this.H60_Cable);
      	})
	 }
		else
	 {
 
	  //this.log("pollDevice " + this.getSetting('address') + " hp type: " + H60_Cable );
	  util.sendCommand('/api/homey', this.getSetting('address'))
	    .then(result => {
			
			var v ;
			var j=0;
							
			while(this.cap[j] != "eof")
				{
				v = result['X' + this.cap[j+1]]; // Set new value from H60 Json response
				
				if (v > 60000) v=v-65536; // Recalc if Negative
				if (v != 0 && String(this.cap[j+1]).substring(0,1) =='0') v = v  / 10;  // Devide by 10 if TEMP or %
			
				if (v != this.getCapabilityValue(this.cap[j]))  // Has value changed
			    { 
			        this.setCapabilityValue(String(this.cap[j]), v);  // Set in app
			        this.log("set:" + this.H60_Cable + "  " + this.cap[j] + " = " + v);   
				
					
				if(this.cap[j] == 'OUTDOOR_TEMP') 			{Homey.ManagerFlow.getCard('trigger', 'outdoor_temp_changed').trigger(this, {temperature: v}, {})  }
				if(this.cap[j] == 'INDOOR_TEMP') 			{Homey.ManagerFlow.getCard('trigger', 'indoor_temp_changed').trigger(this, {temperature: v}, {})  }
				if(this.cap[j] == 'WARM_WATER_TEMP') 		{Homey.ManagerFlow.getCard('trigger', 'warm_water_temp_changed').trigger(this, {temperature: v}, {})  }
				if(this.cap[j] == 'ALARM_STATE') 			{Homey.ManagerFlow.getCard('trigger', 'alarm_state_changed').trigger(this, {temperature: v}, {})  }
				if(this.cap[j] == 'ADDITIONAL_HEATER_POWER') {Homey.ManagerFlow.getCard('trigger', 'additional_heat_changed').trigger(this, {power: v}, {})  }	
				if(this.cap[j] == 'SWITCH_VALVE_STATE') 		{Homey.ManagerFlow.getCard('trigger', 'switch_valve_state_changed').trigger(this, {power: v}, {})  }	
				if(this.cap[j] == 'ROOM_SET_TEMP') 	    	{this.setCapabilityValue('target_temperature', v); } // termostat		
			    }
				
				j=j+2; 
		  
			}
		
			
			  		  
		}
	)
	 
		  
        .catch(error => {
          this.log(error);
          this.setUnavailable(Homey.__('Unreachable'));
          this.pingDevice();
        })
	 }	
    }, 1000 * interval);
  }

  async onSetTargetTemperature(data, opts) {
    //let value = data[Capabilities.TARGET_TEMP];
	let value = data['target_temperature'];
    this.log('setting target temperature to', value);
    value = value * 10;
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
