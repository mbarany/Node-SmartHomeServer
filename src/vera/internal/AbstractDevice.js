'use strict';

var _ = require('underscore');

var ApiService = require('./ApiService');


var AbstractDevice = function () {};

AbstractDevice.prototype.initialize = function (api, deviceData) {
    this.api = api;
    this.deviceId = deviceData.id;
    this.deviceName = deviceData.name;
    this.parseStates(deviceData.states);
    return this;
};

AbstractDevice.prototype._action = function (service, actionValue) {
    if (!service instanceof ApiService) {
        throw new Error('Invalid ApiService!');
    }
    var data = {
        serviceId: service.serviceId,
        DeviceNum: this.getId(),
    };
    data[service.value] = actionValue;

    return this.api.action(data, service.action);
};

AbstractDevice.prototype.getId = function () {
    return this.deviceId;
};

AbstractDevice.prototype.getName = function () {
    return this.deviceName;
};

AbstractDevice.prototype.getStatus = function () {
    throw new Error('getStatus not implemented!');
};

AbstractDevice.prototype.setState = function (state) {
    var num;

    if (_.isString(state) && this[state]) {
        return this[state]();
    }
    num = parseInt(state, 10);
    if (_.isNumber(num) && !isNaN(num)) {
        return this.setStateNumber(num);
    }
    throw new Error('Invalid state for "' + state + '"!');
};

AbstractDevice.prototype.setStateNumber = function (n) {
    throw new Error('setStateNumber not implemented!');
};

AbstractDevice.prototype.parseStates = function (states) {
    throw new Error('parseStates not implemented!');
};

module.exports = AbstractDevice;
