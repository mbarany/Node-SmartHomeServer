'use strict';

var _ = require('underscore');

var AbstractDevice = require('./internal/AbstractDevice');
var ApiService = require('./internal/ApiService');


var SERVICES = {
    SWITCH: new ApiService(
        'urn:upnp-org:serviceId:SwitchPower1',
        'SetTarget',
        'newTargetValue'
    ),
};

var Switch = AbstractDevice.extend({

    type: 'Switch',

    on: function () {
        return this._action(SERVICES.SWITCH, 1);
    },

    off: function () {
        return this._action(SERVICES.SWITCH, 0);
    },

    getStatus: function () {
        return this.status ? 'On' : 'Off';
    },

    setStateNumber: function (value) {
        throw new Error('Invalid state for value "' + value + '"!');
    },

    parseStates: function (states) {
        var state = _(states).where({
            service: SERVICES.SWITCH.serviceId,
            variable: 'Status'
        });

        if (state.length) {
            this.status = parseInt(state[0].value, 10);
        }
    },

});

module.exports = Switch;
