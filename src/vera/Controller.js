import _ from 'underscore';
import {EventEmitter2} from 'eventemitter2';
import deviceFactory from './devices/deviceFactory';
const log = require('debug')('App:Controller');

class Controller {
    constructor(api, cache) {
        this.api = api;
        this.cache = cache;
        this.clearDeviceCache = false;
        this.config = api.config;
        this.deviceData = [];
        this.devices = null;
        this.remoteUrlSession = '';
        this.bus = new EventEmitter2({
            wildcard: true,
            delimiter: '.',
            newListener: false
        });

        return this;
    }

    load() {
        return _loadDevices.call(this);
    }

    getCategorizedDevices() {
        const _this = this;

        this.clearDeviceCache = true;
        return this.load().then(() => _getCategorizedDevices.call(_this));
    }

    getBus() {
        return this.bus;
    }
}

const CACHE_DEVICES = 'devices';

function _loadDevicesFromApi() {
    return this.api.userData()
        .then(data => {
            return deviceFactory.filterDevices(data.devices).map(device => ({
                id: device.id,
                name: device.name,
                deviceType: device.device_type,
                states: device.states
            }));
        });
}

function _createDeviceInstances() {
    const _this = this;

    this.devices = {};
    _(this.deviceData).each(function (device) {
        _this.devices[device.id] = deviceFactory.create(_this.api, device, _this.bus);
    });
}

function _loadDevices() {
    const _this = this;
    const cacheTime = this.clearDeviceCache ? 0 : 30 * 60;

    this.clearDeviceCache = false;
    return this.cache.get(CACHE_DEVICES, cacheTime)
        .then(data => {
            log('Using devices cache...');
            _this.deviceData = data;
        }, () => _loadDevicesFromApi.call(_this)
        .then(devices => {
            _this.deviceData = devices;
            log('Writing deviceData to cache...');
            _this.cache.set(CACHE_DEVICES, _this.deviceData);
        }, () => {
            log('Api Failure! Trying to use stale cache...');
            return _this.cache.get(CACHE_DEVICES);
        }))
        .then(() => {
            if (!_this.devices) {
                _createDeviceInstances.call(_this);
            }
        });
}

function _getCategorizedDevices() {
    const categorizedDevices = {
        switches: [],
        dimmableSwitches: [],
        thermostats: [],
    };

    _(this.devices).each(device => {
        const data = {
            id: device.getId(),
            name: device.getName(),
            type: device.constructor.name,
            status: device.status,
            statusText: device.getStatus(),
        };

        switch (device.constructor.name) {
            case 'Switch':
                categorizedDevices.switches.push(data);
                break;
            case 'DimmableSwitch':
                categorizedDevices.dimmableSwitches.push(data);
                break;
            case 'Thermostat':
                categorizedDevices.thermostats.push(data);
                break;
            default:
                throw new Error(`Unknown device type for "${data.id}"!`);
        }
    });
    return categorizedDevices;
}

module.exports = Controller;
