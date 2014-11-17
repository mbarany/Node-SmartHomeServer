var _ = require('underscore');

var AbstractDevice = require('./internal/AbstractDevice');
var ApiService = require('./internal/ApiService');


var SERVICES = {
    SWITCH: new ApiService(
        'urn:upnp-org:serviceId:SwitchPower1',
        'SetTarget',
        'newTargetValue'
    ),
    DIMMER: new ApiService(
        'urn:upnp-org:serviceId:Dimming1',
        'SetLoadLevelTarget',
        'newLoadlevelTarget'
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
    return this.dim(value);
};

Switch.prototype.dim = function (value) {
    var validRange = _.range(0, 101);
    value = parseInt(value, 10);
    if (!_(validRange).contains(value)) {
        throw new Error('Invalid dim value for "' + value + '"!');
    }
    return this._action(SERVICES.DIMMER, value);
};

module.exports = Switch;
