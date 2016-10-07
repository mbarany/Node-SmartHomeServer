'use strict';

var _ = require('underscore');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

var log = require('../log').prefix('Controller');
var Switch = require('./Switch');
var DimmableSwitch = require('./DimmableSwitch');
var Thermostat = require('./Thermostat');


var Controller = function (api, cache) {
    this.api = api;
    this.cache = cache;
    this.clearDeviceCache = false;
    this.config = api.config;
    this.deviceData = [];
    this.devices = {};
    this.remoteUrlSession = '';
    this.bus = new EventEmitter2({
        wildcard: true,
        delimiter: '::',
        newListener: false
    });

    return this;
};

var CACHE_DEVICES = 'devices';
var DEVICE_TYPE = {
    ZWAVE_NETWORK: 'urn:schemas-micasaverde-com:device:ZWaveNetwork:1',
    SCENE_CONTROLLER: 'urn:schemas-micasaverde-com:device:SceneController:1',
    BINARY_SWITCH: 'urn:schemas-upnp-org:device:BinaryLight:1',
    DIMMABLE_SWITCH: 'urn:schemas-upnp-org:device:DimmableLight:1',
    THERMOSTAT: 'urn:schemas-upnp-org:device:HVAC_ZoneThermostat:1',
};

function _loadDevicesFromApi() {
    var _this = this;

    return _this.api.userData()
        .then(function (data) {
            var zwaveNetwork =_(data.devices).findWhere({ device_type: DEVICE_TYPE.ZWAVE_NETWORK });

            return _(data.devices).filter(function (device) {
                return device.id_parent === zwaveNetwork.id && device.device_type !== DEVICE_TYPE.SCENE_CONTROLLER;
            }).map(function (device) {
                return {
                    id: device.id,
                    name: device.name,
                    deviceType: device.device_type,
                    states: device.states,
                };
            });
        });
}

function _getDeviceClass(deviceType) {
    switch (deviceType) {
        case DEVICE_TYPE.BINARY_SWITCH:
            return Switch;
        case DEVICE_TYPE.DIMMABLE_SWITCH:
            return DimmableSwitch;
        case DEVICE_TYPE.THERMOSTAT:
            return Thermostat;
        default:
            throw new Error('Unknown deviceType "' + deviceType + '"!');
    }
}

function _createDeviceInstances() {
    var _this = this;

    _(this.deviceData).each(function (device) {
        var ClassName = _getDeviceClass.call(this, device.deviceType);
        _this.devices[device.id] = new ClassName(_this.api, device, _this.bus);
    });
}

function _loadDevices() {
    var _this = this;
    var cacheTime = this.clearDeviceCache ? 0 : 30 * 60;

    this.clearDeviceCache = false;
    return this.cache.get(CACHE_DEVICES, cacheTime)
        .then(function (data) {
            log('Using devices cache...');
            _this.deviceData = data;
        }, function () {
            return _loadDevicesFromApi.call(_this)
                .then(function (devices) {
                    _this.deviceData = devices;
                    log('Writing deviceData to cache...');
                    _this.cache.set(CACHE_DEVICES, _this.deviceData);
                }, function () {
                    log('Api Failure! Trying to use stale cache...');
                    return _this.cache.get(CACHE_DEVICES);
                });
        })
        .then(function () {
            _createDeviceInstances.call(_this);
        });
}

function _getCategorizedDevices() {
    var categorizedDevices = {
        switches: [],
        dimmableSwitches: [],
        thermostats: [],
    };

    _(this.devices).each(function (device) {
        var data = {
            id: device.getId(),
            name: device.getName(),
            type: device.type,
            status: device.status,
            statusText: device.getStatus(),
        };

        if (device instanceof Switch) {
            categorizedDevices.switches.push(data);
        } else if (device instanceof DimmableSwitch) {
            categorizedDevices.dimmableSwitches.push(data);
        } else if (device instanceof Thermostat) {
            categorizedDevices.thermostats.push(data);
        } else {
            throw new Error('Unknown device type for "' + data.id + '"!');
        }
    });
    return categorizedDevices;
}

function _startVeraEventListener () {
    _getStatus.call(this);
}

function _getStatus() {
    var _this = this;
    var params = {
        MinimumDelay: 1000,
        Timeout: 120,
        DataVersion: this._DataVersion || 0,
        LoadTime: this._LoadTime || 0,
    };

    this.api.status(params).then(function (res) {
        _this._DataVersion = res.DataVersion;
        _this._LoadTime = res.LoadTime;

        _(res.devices).each(function (d) {
            if (!d.states) {
                return;
            }
            _this.devices[d.id].parseStates(d.states);
        });
    }).fin(function () {
        _getStatus.call(_this);
    });
}

Controller.prototype.load = function () {
    var _this = this;

    return _loadDevices.call(this).then(function () {
        log('Starting Vera event listener...');
        _startVeraEventListener.call(_this);
    });
};

Controller.prototype.getCategorizedDevices = function () {
    var _this = this;

    this.clearDeviceCache = true;
    return this.load().then(function () {
        return _getCategorizedDevices.call(_this);
    });
};

Controller.prototype.getBus = function () {
    return this.bus;
};

module.exports = Controller;
