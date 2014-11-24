var _ = require('underscore');

var AbstractDevice = require('./internal/AbstractDevice');
var ApiService = require('./internal/ApiService');


var SERVICES = {
    MODE: new ApiService(
        'urn:upnp-org:serviceId:HVAC_UserOperatingMode1',
        'SetModeTarget',
        'NewModeTarget'
    ),
    TEMPERATURE: new ApiService(
        'urn:upnp-org:serviceId:TemperatureSetpoint1',
        'SetCurrentSetpoint',
        'NewCurrentSetpoint'
    ),
};

var Thermostat = function () {
    this.initialize.apply(this, arguments);
};
Thermostat.prototype = _.clone(AbstractDevice.prototype);

Thermostat.prototype.setStateNumber = function (value) {
    return this.temperature(value);
};

Thermostat.prototype.temperature = function (value) {
    value = parseInt(value, 10);
    if (!value) {
        throw new Error('Invalid temperature "' + value + '"!');
    }
    return this._action(SERVICES.TEMPERATURE, value);
};

Thermostat.prototype.getStatus = function () {
    if (this.status.mode !== 'Off') {
        return this.status.mode + ' ' + this.status.temperature + '°F';
    }
    return 'Off';
};

Thermostat.prototype.off = function () {
    return this._action(SERVICES.MODE, 'Off');
};

Thermostat.prototype.heatOn = function () {
    return this._action(SERVICES.MODE, 'HeatOn');
};

Thermostat.prototype.coolOn = function () {
    return this._action(SERVICES.MODE, 'CoolOn');
};

Thermostat.prototype.parseStates = function (states) {
    var stateMode = _(states).where({
        service: SERVICES.MODE.serviceId,
        variable: 'ModeTarget'
    })[0];
    var stateTemperature = _(states).where({
        service: SERVICES.TEMPERATURE.serviceId,
        variable: 'CurrentSetpoint'
    })[0];
    this.status = {
        mode: stateMode.value,
        temperature: stateTemperature.value,
    };
};

module.exports = Thermostat;
