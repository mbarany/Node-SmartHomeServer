var _ = require("underscore");

var log = require('../log');
var Switch = require('./Switch');
var DimmableSwitch = require('./DimmableSwitch');
var Thermostat = require('./Thermostat');


var Controller = function (api, cache) {
    this.api = api;
    this.cache = cache;
    this.config = api.config;
    this.deviceData = [];
    this.devices = {};
    this.remoteUrlSession = '';
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

function _loadDevices() {
    var _this = this;

    return this.cache.get(CACHE_DEVICES, 30 * 60)
        .then(function (data) {
            log('Using devices cache...');
            _this.deviceData = data;
        }, function () {
            return _loadDevicesFromApi.call(_this)
                .then(function (devices) {
                    _this.deviceData = devices;
                    log('Writing deviceData to cache...');
                    _this.cache.set(CACHE_DEVICES, _this.deviceData);
                });
        })
        .then(function () {
            _createDeviceInstances.call(_this);
        });
}

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
                };
            });
        });
}

function _createDeviceInstances() {
    var _this = this;

    _(this.deviceData).each(function (device) {
        var clazz = _getDeviceClass.call(this, device.deviceType);
        _this.devices[device.id] = new clazz(_this.api, device.id, device.name);
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

Controller.prototype.load = function () {
    return _loadDevices.call(this);
};

Controller.prototype.getCategorizedDevices = function () {
    var categorizedDevices = {
        switches: [],
        dimmableSwitches: [],
        thermostats: [],
    };

    _(this.devices).each(function (device) {
        var data = {
            id: device.getId(),
            name: device.getName(),
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
};

module.exports = Controller;
