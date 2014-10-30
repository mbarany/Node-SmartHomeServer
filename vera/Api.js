var _ = require("underscore");
var http = require("q-io/http");

var defaultParams = {
	id: 'lu_action',
	output_format: 'json',
};

var Api = function (config) {
	this.config = config;
};

Api.prototype.action = function (params, device, value) {
	var allParams = _.extend({}, defaultParams, params);
	var url = '';
	var urlParts = [];

	allParams.DeviceNum = device;
	allParams.newTargetValue = value;

	_(allParams).each(function (value, key) {
		urlParts.push(key + '=' + value);
	});
	url = '?' + urlParts.join('&');

	return http.request({
		url: this.config.host + this.config.endpoint + url,
		method: 'GET',
	});
}

module.exports = Api;
