var _ = require('underscore');

var ApiService = require('./ApiService');


var AbstractDevice = function () {};

AbstractDevice.prototype.initialize = function (api, deviceId, deviceName) {
    this.api = api;
    this.deviceId = deviceId;
    this.deviceName = deviceName;
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
}

AbstractDevice.prototype.getId = function () {
    return this.deviceId;
};

AbstractDevice.prototype.getName = function () {
    return this.deviceName;
};

AbstractDevice.prototype.setState = function (state) {
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

module.exports = AbstractDevice;
