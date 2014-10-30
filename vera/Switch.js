function _action(actionValue) {
	return this.api.action({
		serviceId: 'urn:upnp-org:serviceId:SwitchPower1',
		action: 'SetTarget',
	}, this.deviceId, actionValue)
	.then(function (res) {
		console.log('API Status: ' + res.status);
		return res.body.read();
	})
	.then(function (bodyBuffer) {
		console.log('Body: ' + bodyBuffer.toString());
	});
}

var Switch = function (api, deviceId) {
	this.api = api;
	this.deviceId = deviceId;
	return this;
};

Switch.prototype.getId = function () {
	return this.deviceId;
};

Switch.prototype.on = function () {
	return _action.apply(this, [1]);
};

Switch.prototype.off = function () {
	return _action.apply(this, [0]);
};

module.exports = Switch;
