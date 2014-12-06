'use strict';

var _ = require("underscore");
require('colors');


var Cli = function (app) {
    this.app = app;
    this.config = app.config;
};

var ACTIONS = {
    HELP: '--help',
    LIST: '--list',
    SERVER: '--server',
    PREVIEW: '--preview',
};

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

function _getSceneIdFromName(sceneName) {
    if (sceneName && this.config.vera.scenes[sceneName]) {
        return this.config.vera.scenes[sceneName];
    }
}

Cli.prototype.execute = function () {
    var actionAndArgs = _getActionAndArgs(arguments);
    var args = actionAndArgs.args;
    var deviceId = args[0];
    var sceneId = _getSceneIdFromName.call(this, args[0]);
    var state = args[1];

    switch (actionAndArgs.action) {
        case ACTIONS.SERVER:
            return this.app.startServer();
        case ACTIONS.PREVIEW:
            return this.app.previewSchedule();
        case ACTIONS.HELP:
            this.printUsage();
            break;
        case ACTIONS.LIST:
            return this.printDeviceList();
        default:
            if (deviceId && state) {
                return this.app.executeDevice(deviceId, state);
            } else if (sceneId) {
                this.app.executeScene(sceneId);
            } else {
                this.printUsage();
            }
            break;
    }
};

Cli.prototype.printUsage = function () {
    console.log('Usage:'.underline.bold);
    console.log('  Display this help screen: ' + 'node index.js --help'.yellow);
    console.log('  Start the schedule and API server: ' + 'node index.js --server'.yellow);
    console.log('  List all devices and scenes: ' + 'node index.js --list'.yellow);
    console.log('  Preview the current schedule: ' + 'node index.js --preview'.yellow);
    console.log('  Change the state of a device: ' + 'node index.js [device] [state]'.yellow);
    console.log('  Execute a scene: ' + 'node index.js [scene]'.yellow);
    console.log('Examples:'.underline.bold);
    console.log('  Turn den light off: ' + 'node index.js den off'.yellow);
    console.log('  Change main thermostat temperature: ' + 'node index.js main 70'.yellow);
    console.log('  Turn on all lights: ' + 'node index.js all_lights_on'.yellow);
};

Cli.prototype.printDeviceList = function () {
    var _this = this;
    var printer = function (device) {
        console.log('  ' + device.name + ' (' + device.id + ') - ' + device.statusText);
    };

    return this.app.controller.getCategorizedDevices().then(function (categorizedDevices) {
        console.log('On/Off Switches:'.underline.bold);
        _(categorizedDevices.switches).each(printer);
        console.log('Dimmable Switches:'.underline.bold);
        _(categorizedDevices.dimmableSwitches).each(printer);
        console.log('Thermostats:'.underline.bold);
        _(categorizedDevices.thermostats).each(printer);

        //@todo get Scenes from API
        console.log('Scenes:'.underline.bold);
        _(_this.config.vera.scenes).each(function (value, key) {
            console.log('  ' + key + ' (' + value + ')');
        });
    });
};

module.exports = Cli;
