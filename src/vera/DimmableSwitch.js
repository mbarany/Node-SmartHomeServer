'use strict';

var _ = require('underscore');

var AbstractDevice = require('./internal/AbstractDevice');
var ApiService = require('./internal/ApiService');


var SERVICES = {
    DIMMER: new ApiService(
        'urn:upnp-org:serviceId:Dimming1',
        'SetLoadLevelTarget',
        'newLoadlevelTarget'
    ),
};

var DimmableSwitch = AbstractDevice.extend({

    type: 'DimmableSwitch',

    on: function () {
        return this.dim(100);
    },

    off: function () {
        return this.dim(0);
    },

    getStatus: function () {
        return this.status ? this.status + '% On' : 'Off';
    },

    setStateNumber: function (value) {
        return this.dim(value);
    },

    dim: function (value) {
        var validRange = _.range(0, 101);
        value = parseInt(value, 10);
        if (!_(validRange).contains(value)) {
            throw new Error('Invalid dim value for "' + value + '"!');
        }
        return this._action(SERVICES.DIMMER, value);
    },

    parseStates: function (states) {
        var state = _(states).where({
            service: SERVICES.DIMMER.serviceId,
            variable: 'LoadLevelStatus'
        })[0];
        this.status = parseInt(state.value, 10);
    },

});

module.exports = DimmableSwitch;
