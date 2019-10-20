"use strict";

const Homey = require('homey');
const util = require('/lib/util.js');

class H60Driver extends Homey.Driver {

  onPair(socket) {
	  this.log("driver-OnPair")

	const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();
    let selectedDeviceId;
    let deviceArray = {};

    socket.on('list_devices', (data, callback) => {
      
	  const devices = Object.values(discoveryResults).map(discoveryResult => {
       this.log("list_devices " + discoveryResult.address + " " + discoveryResult.id);
		return {
          name: 'H60 ['+ discoveryResult.address +']',
          data: {
            id: discoveryResult.id,
          }
        };
      });
      callback(null, devices);
    });

    socket.on('list_devices_selection', (data, callback) => { // Lists deiscovereed decices
	  this.log("list_devices_selection")
      callback();
      selectedDeviceId = data[0].data.id;
    });

    /*socket.on('login', (data, callback) => {
      const discoveryResult = discoveryResults[selectedDeviceId];
      if(!discoveryResult) return callback(new Error('Something went wrong'));

      util.sendCommand('/shelly', discoveryResult.address, data.username, data.password)
        .then(result => {
          var password = data.password;
          deviceArray = {
            name: 'H60 ['+ discoveryResult.address +']',
            data: {
              id: discoveryResult.id,
            },
            settings: {
              address  : discoveryResult.address,
              username : data.username,
              password : data.password,
              polling  : 5
            },
            store: {
              type: result.type,
              outputs: result.num_outputs
            }
          }
          callback(null, true);
        })
        .catch(error => {
          callback(error, false);
        })
    });
	*/

    socket.on('get_device', (data, callback) => {
	  this.log("get_device")
	  const discoveryResult = discoveryResults[selectedDeviceId];
	  this.log(discoveryResult.address)
      result => {
		  deviceArray = {
			name: 'H60 ['+ discoveryResult.address +']',
			data: {
				id: discoveryResult.id,
				},
			settings: {
				address  : discoveryResult.address,
				polling  : 5
				},
			store: {
              type: result.type,
              outputs: result.num_outputs
            }
	      }	
	  } 
	
      callback(false, deviceArray);
    });

  }

}

module.exports = H60Driver;
