'use strict';

const Homey = require('homey');
//const util = require('/lib/util.js');

class Husdata extends Homey.App {
	
	onInit() {
		this.log('Init Husdata app...');
		
    // Init
  //  new Homey.FlowCardAction('flipbackSwitch')
   //   .register()
	  /*
      .registerRunListener((args, state) => {
        if (args.switch === '1') {
          //return util.sendCommand('/relay/0?turn=on&timer='+ args.timer +'', args.device.getSetting('address'), args.device.getSetting('username'), args.device.getSetting('password'));
        } else {
          //return util.sendCommand('/relay/0?turn=off&timer='+ args.timer +'', args.device.getSetting('address'), args.device.getSetting('username'), args.device.getSetting('password'));
        }
      }
    	 
	 )
	*/
	
	}
	
}

module.exports = Husdata;