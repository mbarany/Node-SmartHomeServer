var _ = require('underscore');

var Switch = require('./Switch');
var ApiService = require('./internal/ApiService');


var SERVICES = {
    DIMMER: new ApiService(
        'urn:upnp-org:serviceId:Dimming1',
        'SetLoadLevelTarget',
        'newLoadlevelTarget'
    ),
};

var DimmableSwitch = function () {
    this.initialize.apply(this, arguments);
};
DimmableSwitch.prototype = _.clone(Switch.prototype);

DimmableSwitch.prototype.setStateNumber = function (value) {
    return this.dim(value);
};

DimmableSwitch.prototype.dim = function (value) {
    var validRange = _.range(0, 101);
    value = parseInt(value, 10);
    if (!_(validRange).contains(value)) {
        throw new Error('Invalid dim value for "' + value + '"!');
    }
    return this._action(SERVICES.DIMMER, value);
};

module.exports = DimmableSwitch;
