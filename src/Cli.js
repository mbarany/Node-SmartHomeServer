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
}

function _getSceneIdFromName(sceneName) {
    if (sceneName && this.config.vera.scenes[sceneName]) {
        return this.config.vera.scenes[sceneName];
    }
}

Cli.prototype.execute = function () {
    var actionAndArgs = _getActionAndArgs(arguments);
    var args = actionAndArgs.args;
    var deviceId = _getDeviceIdFromName.call(this, args[0]);
    var sceneId = _getSceneIdFromName.call(this, args[0]);
    var state = args[1];

    switch (actionAndArgs.action) {
        case ACTIONS.SERVER:
            this.app.startServer();
            break;
        case ACTIONS.PREVIEW:
            this.app.previewSchedule();
            break;
        case ACTIONS.HELP:
            this.printUsage();
            break;
        case ACTIONS.LIST:
            this.printDeviceList();
            break;
        default:
            if (deviceId && state) {
                this.app.executeDevice(deviceId, state);
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
    console.log('  Change the state of a device: ' + 'node index.js [device] [state]'.yellow);
    console.log('  Execute a scene: ' + 'node index.js [scene]'.yellow);
    console.log('Examples:'.underline.bold);
    console.log('  Turn den light off: ' + 'node index.js den off'.yellow);
    console.log('  Change main thermostat temperature: ' + 'node index.js main 70'.yellow);
    console.log('  Turn on all lights: ' + 'node index.js all_lights_on'.yellow);
};

Cli.prototype.printDeviceList = function () {
    var printer = function (value, key) {
        console.log('  ' + key + ' (' + value + ')');
    };

    console.log('Switches:'.underline.bold);
    _(this.config.vera.switches).each(printer);
    console.log('Thermostats:'.underline.bold);
    _(this.config.vera.thermostats).each(printer);
    console.log('Scenes:'.underline.bold);
    _(this.config.vera.scenes).each(printer);
};

module.exports = Cli;
