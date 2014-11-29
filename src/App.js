'use strict';

var _ = require("underscore");
var later = require('later');
var Q = require('q');

var log = require('./log');
var VeraApi = require("./vera/Api");
var VeraController = require('./vera/Controller');
var VeraScene = require("./vera/Scene");
var Schedule = require('./Schedule');
var webServer = require('./web/server');


function _loadScenes() {
    var _this = this;
    var scenes = {};
    _(this.config.vera.scenes).each(function (value, key) {
        scenes[value] = new VeraScene(_this.api, value, key);
    });
    return scenes;
}

var App = function (config, appDir, cache) {
    this.config = config;
    this.appDir = appDir;
    this.cache = cache;
    this.api = new VeraApi(config.vera.api, this.appDir, this.cache);
    this.scenes = _loadScenes.call(this);
    this.controller = new VeraController(this.api, this.cache);
    this.schedule = new Schedule(this.controller, this.scenes, config.schedule, config.location);
};

function _setupSchedule() {
    log.line('Setting up schedule...', true);
    this.schedule.run();
    log.line('Done.' + "\n");
}

App.prototype.load = function () {
    return new Q();
};

App.prototype.executeDevice = function (deviceId, state) {
    var _this = this;

    return this.controller.load().then(function () {
        var device = _this.controller.devices[deviceId];
        if (!device) {
            throw new Error('Invalid device id!');
        }
        device.setState(state);
    });
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

    return this.controller.load().then(function () {
        _setupSchedule.call(_this);
        // Run weekly
        later.setInterval(function () {
            _setupSchedule.call(_this);
        }, sched);

        if (_this.config.api.disabled) {
            return;
        }
        log.line('Starting API Server...', true);
        webServer(_this);
        log.line('Done.' + "\n");
    });
};

App.prototype.previewSchedule = function () {
    var _this = this;

    return this.controller.load().then(function () {
        _this.schedule.preview();
    });
};

module.exports = App;
