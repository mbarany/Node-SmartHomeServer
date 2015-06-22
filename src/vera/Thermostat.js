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

    status: {
        mode: undefined,
        temperature: undefined,
    },

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

    hasStatus: function (state) {
        if (_.isNumber(state)) {
            return this.status.temperature === state;
        }
        return this.status.mode.toLowerCase() === state.toLowerCase();
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
            variable: 'ModeStatus'
        });
        var stateTemperature = _(states).where({
            service: SERVICES.TEMPERATURE.serviceId,
            variable: 'CurrentSetpoint'
        });
        var newStatus = _.extend({}, this.status);

        if (stateMode.length) {
            newStatus.mode = stateMode[0].value;
        }
        if (stateTemperature.length) {
            newStatus.temperature = parseInt(stateTemperature[0].value, 10);
        }
        this.setStatus(newStatus);
    },

});

module.exports = Thermostat;
