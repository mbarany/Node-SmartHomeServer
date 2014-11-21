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

var Switch = function () {
    this.initialize.apply(this, arguments);
};
Switch.prototype = _.clone(AbstractDevice.prototype);

Switch.prototype.on = function () {
    return this._action(SERVICES.SWITCH, 1);
};

Switch.prototype.off = function () {
    return this._action(SERVICES.SWITCH, 0);
};

Switch.prototype.setStateNumber = function (value) {
    throw new Error('Invalid state for value "' + value + '"!');
};

module.exports = Switch;
