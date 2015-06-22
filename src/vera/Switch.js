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

    hasStatus: function (state) {
        var status = state === 'on' ? 1 : 0;
        return this.status === status;
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
            var newStatus = parseInt(state[0].value, 10);
            this.setStatus(newStatus);
        }
    },

});

module.exports = Switch;
