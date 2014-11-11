var _ = require("underscore");
var colors = require('colors');
var later = require('later');

var VeraApi = require("./vera/Api");
var VeraSwitch = require("./vera/Switch");
var VeraThermostat = require("./vera/Thermostat");
var VeraScene = require("./vera/Scene");
var Schedule = require('./Schedule');


var App = function (config) {
    this.config = config;
    this.api = new VeraApi(config.vera.api);
    this.devices = _loadDevices.call(this);
    this.scenes = _loadScenes.call(this);
    this.schedule = new Schedule(this.devices, this.scenes, config.schedule, config.location);
};

var ACTIONS = {
    HELP: '--help',
    LIST: '--list',
    SERVER: '--server',
    PREVIEW: '--preview',
};

function _loadDevices() {
    var _this = this;
    var devices = {};
    _(this.config.vera.switches).each(function (value, key) {
        devices[value] = new VeraSwitch(_this.api, value, key);
    });
    _(this.config.vera.thermostats).each(function (value, key) {
        devices[value] = new VeraThermostat(_this.api, value, key);
    });
    return devices;
}

function _loadScenes() {
    var _this = this;
    var scenes = {};
    _(this.config.vera.scenes).each(function (value, key) {
        scenes[value] = new VeraScene(_this.api, value, key);
    });
    return scenes;
}

function _setupSchedule() {
    process.stdout.write('Clearing out old schedule...');
    this.schedule.clearTimers();
    process.stdout.write('Done.' + "\n");

    process.stdout.write('Setting up new schedule...');
    this.schedule.run();
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

function _getDeviceIdFromName(device) {
    if (!device) {
        return;
    }
    if (this.config.vera.switches[device]) {
        return this.config.vera.switches[device];
    }
    if (this.config.vera.thermostats[device]) {
        return this.config.vera.thermostats[device];
    }
};

function _getSceneIdFromName(sceneName) {
    if (sceneName && this.config.vera.scenes[sceneName]) {
        return this.config.vera.scenes[sceneName];
    }
}

App.prototype.execute = function () {
    var actionAndArgs = _getActionAndArgs(arguments);
    var args = actionAndArgs.args;
    var deviceId = _getDeviceIdFromName.call(this, args[0]);
    var sceneId = _getSceneIdFromName.call(this, args[0]);
    var state = args[1];

    switch (actionAndArgs.action) {
        case ACTIONS.SERVER:
            this.startServer();
            break;
        case ACTIONS.PREVIEW:
            this.previewSchedule();
            break;
        case ACTIONS.HELP:
            this.printUsage();
            break;
        case ACTIONS.LIST:
            this.printDeviceList();
            break;
        default:
            if (deviceId && state) {
                this.executeDevice(deviceId, state);
            } else if (sceneId) {
                this.executeScene(sceneId);
            } else {
                this.printUsage();
            }
            break;
    }
};

App.prototype.printUsage = function () {
    console.log('Usage:'.underline.bold);
    console.log('  Display this help screen: ' + 'node index.js --help'.yellow);
    console.log('  Start the schedule server: ' + 'node index.js --server'.yellow);
    console.log('  List all devices and scenes: ' + 'node index.js --list'.yellow);
    console.log('  Change the state of a device: ' + 'node index.js [device] [state]'.yellow);
    console.log('  Execute a scene: ' + 'node index.js [scene]'.yellow);
    console.log('Examples:'.underline.bold);
    console.log('  Turn den light off: ' + 'node index.js den off'.yellow);
    console.log('  Change main thermostat temperature: ' + 'node index.js main 70'.yellow);
    console.log('  Turn on all lights: ' + 'node index.js all_lights_on'.yellow);
};

App.prototype.printDeviceList = function () {
    console.log('Switches:'.underline.bold);
    _(this.config.vera.switches).each(function (value, key) {
        console.log('  ' + key);
    });
    console.log('Thermostats:'.underline.bold);
    _(this.config.vera.thermostats).each(function (value, key) {
        console.log('  ' + key);
    });
    console.log('Scenes:'.underline.bold);
    _(this.config.vera.scenes).each(function (value, key) {
        console.log('  ' + key);
    });
};

App.prototype.executeDevice = function (deviceId, state) {
    var device = this.devices[deviceId];
    device.setState(state);
};

App.prototype.executeScene = function (sceneId) {
    var scene = this.scenes[sceneId];
    scene.run();
};

App.prototype.startServer = function () {
    var _this = this;

    _setupSchedule.call(this);
    // Run weekly
    later.setInterval(function () {
        _setupSchedule.call(_this);
    }, later.parse.cron('0 0 * * 0'));
};

App.prototype.previewSchedule = function () {
    this.schedule.preview();
};

module.exports = App;
