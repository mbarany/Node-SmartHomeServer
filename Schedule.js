var _ = require('underscore');
var later = require('later');
var SunCalc = require('suncalc');
var moment = require('moment');

var _d = require('./date-helper');


function _convertMomentToSchedule(m) {
	var d = m.toDate();
	return later.parse.recur()
		.on(later.hour.val(d)).hour()
		.on(later.minute.val(d)).minute()
		.on(later.dayOfYear.val(d)).dayOfYear();
}

var Schedule = function (switches, opts) {
	this.switches = switches;
	this.opts = opts || {};
	this._timers = [];
	return this;
};

Schedule.TYPES = {
	EXACT: 'exact',
	SUNRISE: 'sunrise',
	SUNSET: 'sunset',
};

Schedule.prototype.getSwitch = function (deviceId) {
	var sw = _(this.switches).find(function (s) {
		return s.getId() === deviceId;
	});
	if (!sw) {
		throw new Error('Device not found with id "' + deviceId + '"!');
	}
	return sw;
};

Schedule.prototype.getLat = function () {
	if (!this.opts.lat) {
		throw new Error('lat not found!');
	}
	return this.opts.lat;
};

Schedule.prototype.getLon = function () {
	if (!this.opts.lon) {
		throw new Error('lon not found!');
	}
	return this.opts.lon;
};

Schedule.prototype.getTimes = function (date) {
	var m = moment(date);
	m.set('hour', 12); //hack: set to mid-day to get correct times
	return SunCalc.getTimes(m.toDate(), this.getLat(), this.getLon());
};

Schedule.prototype.run = function (schedule) {
	var _this = this;
	var m = moment().startOf('week');
	var days = 7;

	_d(m.toDate(), days - 1).each(function (d) {
		var m = moment(d);
		_(schedule.weekly).each(function (w) {
			_(w.days).each(function (day) {
				if (day !== m.day() + 1) {
					return;
				}

				var onDate;
				switch (w.type) {
					case Schedule.TYPES.EXACT:
						onDate = moment(m)
						break;
					case Schedule.TYPES.SUNSET:
						onDate = moment(_this.getTimes(d).sunset);
						break;
					case Schedule.TYPES.SUNRISE:
						onDate = moment(_this.getTimes(d).sunrise);
						break;
				}
				onDate.add(w.on, 'minutes');

				var schedOn = _convertMomentToSchedule(onDate);
				_this._timers.push(later.setTimeout(function () {
					_(w.devices).each(function (deviceId) {
						_this.getSwitch(deviceId).on();
					});
				}, schedOn));

				if (w.off) {
					var offDate = moment(onDate);
					offDate.add(w.off, 'minutes');
					var schedOff = _convertMomentToSchedule(offDate);
					later.setTimeout(function () {
						_(w.devices).each(function (deviceId) {
							_this.getSwitch(deviceId).off();
						});
					}, schedOff);
				}
			});
		});
	});
};

Schedule.prototype.clearTimers = function () {
	_(this._timers).each(function (timer) {
		timer.clear();
	});
	this._timers = [];
};

module.exports = Schedule;
