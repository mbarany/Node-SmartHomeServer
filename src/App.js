'use strict';

var _ = require("underscore");
var later = require('later');
var Q = require('q');
var Pushbullet = require('pushbullet');

var log = require('./log').prefix('App');
var errors = require('./errors');
var VeraApi = require("./vera/Api");
var VeraController = require('./vera/Controller');
var VeraScene = require("./vera/Scene");
var Schedule = require('./Schedule');
var webServer = require('./web/server');


var App = function (nconf, appDir, cache) {
    var _this = this;

    this.appDir = appDir;
    this.cache = cache;
    this.api = new VeraApi(nconf.get('vera:api'), this.appDir, this.cache);
    this.scenes = _(nconf.get('vera:scenes')).map(function (value, key) {
        return new VeraScene(_this.api, value, key);
    });
    this.controller = new VeraController(this.api, this.cache);
    this.schedule = new Schedule(this.controller, this.scenes, nconf.get('schedule'), nconf.get('location'));
    this.apiServerConfig = nconf.get('api');
    this.pushbulletConfig = nconf.get('pushbullet');
};

function _setupSchedule() {
    log.line('Setting up schedule...', true);
    this.schedule.run();
    log.line('Done.' + "\n");
}

function sendStartNotif(config) {
    var pusher = new Pushbullet(config.accessToken);
    pusher.note(config.device, 'Node Vera Server', 'The server has started', function(error, response) {});
}

App.prototype.load = function () {
    return new Q();
};

App.prototype.executeDevice = function (deviceId, state) {
    var _this = this;

    return this.controller.load().then(function () {
        var device = _this.controller.devices[deviceId];
        if (!device) {
            throw new errors.ClientError('Invalid device id!');
        }
        device.setState(state);
    });
};

App.prototype.executeScene = function (sceneId) {
    var scene = this.scenes[sceneId];
    if (!scene) {
        throw new Error('Invalid scene id!');
    }
    return scene.run();
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

        if (_this.apiServerConfig.disabled) {
            return;
        }
        log.line('Starting API Server...', true);
        webServer(_this, _this.apiServerConfig);
        log.line('Done.' + "\n");
        if (_this.pushbulletConfig.accessToken && _this.pushbulletConfig.device) {
            sendStartNotif.call(_this, _this.pushbulletConfig);
        }
    });
};

App.prototype.previewSchedule = function () {
    var _this = this;

    return this.controller.load().then(function () {
        return _this.schedule.preview();
    });
};

module.exports = App;
