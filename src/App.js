var _ = require("underscore");
var later = require('later');

var log = require('./log');
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
    log.line('Setting up schedule...', true);
    this.schedule.run();
    log.line('Done.' + "\n");
}

App.prototype.executeDevice = function (deviceId, state) {
    var device = this.devices[deviceId];
    if (!device) {
        throw new Error('Invalid device id!');
    }
    device.setState(state);
};

App.prototype.executeScene = function (sceneId) {
    var scene = this.scenes[sceneId];
    if (!scene) {
        throw new Error('Invalid scene id!');
    }
    scene.run();
};

App.prototype.startServer = function () {
    var _this = this;
    var startOfWeek = this.schedule.getStartOfWeek().toDate();
    var sched = later.parse.recur()
        .on(later.dayOfWeek.val(startOfWeek)).dayOfWeek()
        .on(later.hour.val(startOfWeek)).hour()
        .on(later.minute.val(startOfWeek)).minute();

    _setupSchedule.call(this);
    // Run weekly
    later.setInterval(function () {
        _setupSchedule.call(_this);
    }, sched);

    log.line('Starting API Server...', true);
    require('./web/server')(this);
    log.line('Done.' + "\n");
};

App.prototype.previewSchedule = function () {
    this.schedule.preview();
};

module.exports = App;
