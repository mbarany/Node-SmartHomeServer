'use strict';

var _ = require('underscore');

var ApiService = require('./ApiService');


var AbstractDevice = function (api, deviceData, bus) {
    this.api = api;
    this.bus = bus;
    this.deviceId = deviceData.id;
    this.deviceName = deviceData.name;
    this.parseStates(deviceData.states);
    return this;
};

AbstractDevice.extend = function (subPrototype) {
    var Clazz = function () {
        this._super.constructor.apply(this, arguments);
    };

    subPrototype = subPrototype || {};
    Clazz.prototype = Object.create(AbstractDevice.prototype);
    Clazz.prototype.constructor = Clazz;
    Clazz.prototype._super = AbstractDevice.prototype;
    _(subPrototype).each(function (value, key) {
        Clazz.prototype[key] = value;
    });
    return Clazz;
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

AbstractDevice.prototype.setStatus = function (newStatus) {
    var oldStatus = _.isObject(this.status) ? _.extend({}, this.status) : this.status;

    if (_.isEqual(oldStatus, newStatus)) {
        return;
    }
    this.status = newStatus;
    this.bus.emit(['device', 'change', this.getId()], {
        oldStatus: oldStatus,
        newStatus: newStatus
    });
};

AbstractDevice.prototype.hasStatus = function () {
    throw new Error('hasStatus not implemented!');
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
