'use strict';

var _ = require('underscore');
var Q = require('q');
require('colors');


var Cli = function (app) {
    this.app = app;
};

var ACTIONS = {
    HELP: 'help',
    LIST: 'list',
    SERVER: 'server',
    PREVIEW: 'preview',
};

Cli.prototype.execute = function (nconf) {
    var args = nconf.get('_');

    if (nconf.get(ACTIONS.SERVER)) {
        return this.app.startServer();
    }
    if (nconf.get(ACTIONS.PREVIEW)) {
        return this.printSchedulePreview();
    }
    if (nconf.get(ACTIONS.LIST)) {
        return this.printDeviceList(nconf);
    }
    if (nconf.get(ACTIONS.HELP)) {
        return this.printUsage();
    }
    if (args.length === 2) {
        return this.app.executeDevice(args[0], args[1]);
    }
    if (args.length === 1) {
        return this.app.executeScene(args[0]);
    }
    return this.printUsage();
};

Cli.prototype.printUsage = function () {
    console.log('Usage:'.underline.bold);
    console.log('  Display this help screen: ' + 'node index.js --help'.yellow);
    console.log('  Start the schedule and API server: ' + 'node index.js --server'.yellow);
    console.log('  List all devices and scenes: ' + 'node index.js --list'.yellow);
    console.log('  Preview the current schedule: ' + 'node index.js --preview'.yellow);
    console.log('  Change the state of a device: ' + 'node index.js [deviceId] [state]'.yellow);
    console.log('  Execute a scene: ' + 'node index.js [sceneId]'.yellow);
    console.log('Examples:'.underline.bold);
    console.log('  Turn den light off: ' + 'node index.js den off'.yellow);
    console.log('  Change main thermostat temperature: ' + 'node index.js main 70'.yellow);
    console.log('  Turn on all lights: ' + 'node index.js all_lights_on'.yellow);

    return new Q();
};

Cli.prototype.printDeviceList = function (nconf) {
    var scenes = nconf.get('vera:scenes');
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
        _(scenes).each(function (value, key) {
            console.log('  ' + key + ' (' + value + ')');
        });
    });
};

Cli.prototype.printSchedulePreview = function () {
    return this.app.previewSchedule().then(function (preview) {
        console.log(preview.title.green.bold.underline, '\n');
        _(preview.events).each(function (e) {
            console.log(e.date.bold.underline);
            if (e.scenes.length) {
                console.log('  Scenes:');
                console.log('    ' + e.scenes);
            }
            if (e.devices.length) {
                console.log('  Devices:');
                console.log('    ' + e.devices);
            }
            console.log('');
        });
    });
};

module.exports = Cli;
