var Schedule = require('../Schedule');

var devices = { //This is the device id in the Vera system
	living_room: 6,
	dining_room: 7,
	master_bedroom: 8,
};

var config = {
	vera: {
		api: {
			host: 'http://192.168.1.X',
			endpoint: '/port_3480/data_request',
		},
		devices: devices,
	},
	location: { //Used for getting Sunrise/Sunset times
		lat: 40.7056308,
		lon: -73.9780035,
	},
	schedule: {
		weekly: [
			{ days: [1,7], type: Schedule.TYPES.SUNRISE, on: 1.25 * 60, off: 4 * 60 },
			{ days: [2,3,4,5,6], type: Schedule.TYPES.SUNSET, on: -1.25 * 60, off: 4 * 60, devices: [devices.master_bedroom] },
			{ days: [5], type: Schedule.TYPES.EXACT, on: 15 * 60 + 9, off: 1, devices: [devices.dining_room] },
		]
	},
};

module.exports = config;
