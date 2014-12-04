'use strict';

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

var Thermostat = AbstractDevice.extend({

    type: 'Thermostat',

    setStateNumber: function (value) {
        return this.temperature(value);
    },

    temperature: function (value) {
        value = parseInt(value, 10);
        if (!value) {
            throw new Error('Invalid temperature "' + value + '"!');
        }
        return this._action(SERVICES.TEMPERATURE, value);
    },

    getStatus: function () {
        if (this.status.mode !== 'Off') {
            return this.status.mode + ' ' + this.status.temperature + '°F';
        }
        return 'Off';
    },

    off: function () {
        return this._action(SERVICES.MODE, 'Off');
    },

    heatOn: function () {
        return this._action(SERVICES.MODE, 'HeatOn');
    },

    coolOn: function () {
        return this._action(SERVICES.MODE, 'CoolOn');
    },

    parseStates: function (states) {
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
            temperature: parseInt(stateTemperature.value, 10),
        };
    },

});

module.exports = Thermostat;
