var _ = require("underscore");
var colors = require('colors');
var later = require('later');

var VeraApi = require("./vera/Api");
var VeraSwitch = require("./vera/Switch");
var Schedule = require('./Schedule');


var App = function (config) {
	this.config = config;
	this.api = new VeraApi(config.vera.api);
	this.switches = _loadSwitches.call(this);
	this.schedule = new Schedule(this.switches, config.location);
};

var ACTIONS = {
	HELP: '--help',
	SERVER: '--server',
};

function _loadSwitches() {
	var _this = this;
	var switches = {};
	_(this.config.vera.devices).each(function (value, key) {
		switches[key] = new VeraSwitch(_this.api, value);
	});
	return switches;
}

function _setupSchedule() {
	process.stdout.write('Clearing out old schedule...');
	this.schedule.clearTimers();
	process.stdout.write('Done.' + "\n");

	process.stdout.write('Setting up new schedule...');
	this.schedule.run(this.config.schedule);
	process.stdout.write('Done.' + "\n");
}

function _getActionAndArgs(args) {
	var actionAndArgs = {
		args: [],
	};
	_(args).each(function (arg) {
		if (arg.substring(0, 2) === '--') {
			actionAndArgs.action = arg;
		} else {
			actionAndArgs.args.push(arg);
		}
	});
	return actionAndArgs;
}

App.prototype.execute = function () {
	var actionAndArgs = _getActionAndArgs(arguments);
	var args = actionAndArgs.args;
	var device = this.validateDevice(args[0]);
	var state = args[1] || 'on';

	switch (actionAndArgs.action) {
		case ACTIONS.SERVER:
			this.startServer();
			break;
		case ACTIONS.HELP:
			this.printUsage();
			break;
		default:
			if (device) {
				this.executeSwitch(device, state);
			} else {
				this.printUsage();
			}
			break;
	}
};

App.prototype.validateDevice = function (device) {
	if (device && this.switches[device]) {
		return device;
	}
};

App.prototype.printUsage = function () {
	console.log('Usage:'.underline.bold);
	console.log('  Displays this help screen: node index.js --help');
	console.log('  Starts the schedule server:  node index.js --server');
	console.log('  Changes the state on a switch:  node index.js [device] [state]');
	console.log('Examples:'.underline.bold);
	console.log('  Turn den light off: node index.js den off');
};

App.prototype.executeSwitch = function (device, state) {
	if (!this.switches[device]) {
		throw new Error('No device found by the name "' + device + '"!');
	}
	if (!_.isFunction(this.switches[device][state])) {
		throw new Error('Device does not have the state "' + state + '"!');
	}
	this.switches[device][state]();
};

App.prototype.startServer = function () {
	var _this = this;

	_setupSchedule.call(this);
	// Run weekly
	later.setInterval(function () {
		_setupSchedule.call(_this);
	}, later.parse.cron('0 0 * * 0'));
};

module.exports = App;
