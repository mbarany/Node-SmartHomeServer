var _ = require('underscore');
var later = require('later');
var SunCalc = require('suncalc');
var moment = require('moment');

var _d = require('./date-helper');


var Schedule = function (devices, scenes, opts) {
	this.devices = devices;
	this.scenes = scenes;
	this.opts = opts || {};
	this._timers = [];
	return this;
};

var ALL_DAYS = _.range(1, 8);

function _convertMomentToSchedule(m) {
	var d = new Date(m.toDate());
	return later.parse.recur()
		.on(later.hour.val(d)).hour()
		.on(later.minute.val(d)).minute()
		.on(later.dayOfYear.val(d)).dayOfYear();
}

function _convertToSequence(weeklyScedule) {
	if (weeklyScedule.sequence) {
		return weeklyScedule.sequence;
	}

	var sequence = {
		at: weeklyScedule.at,
	};
	if (weeklyScedule.devices) {
		sequence.devices = weeklyScedule.devices;
	}
	if (weeklyScedule.scenes) {
		sequence.scenes = weeklyScedule.scenes;
	}
	return [sequence];
}

function _getTimes(date) {
	var m = moment(date);
	m.set('hour', 12); //hack: set to mid-day to get correct times
	return SunCalc.getTimes(m.toDate(), this.getLat(), this.getLon());
};

function _getDateFromType(m, type) {
	switch (type) {
		case Schedule.TYPES.EXACT:
			return moment(m)
		case Schedule.TYPES.SUNSET:
			return moment(_getTimes.apply(this, [m.toDate()]).sunset);
		case Schedule.TYPES.SUNRISE:
			return moment(_getTimes.apply(this, [m.toDate()]).sunrise);
		default:
			throw new Error('Invalid type "' + type + '"!');
	}
}

function _getScene(sceneId) {
	if (!this.scenes[sceneId]) {
		throw new Error('Scene not found with id "' + sceneId + '"!');
	}
	return this.scenes[sceneId];
};

function _getDevice(deviceId) {
	if (!this.devices[deviceId]) {
		throw new Error('Device not found with id "' + deviceId + '"!');
	}
	return this.devices[deviceId];
};

function _setupScheduleSequence(scheduleDate, sequence) {
	var _this = this;
	_(sequence).each(function (s) {
		scheduleDate.add(s.at, 'minutes');
		var sched = _convertMomentToSchedule(scheduleDate);
		_this._timers.push(later.setTimeout(function () {
			_(s.scenes).each(function (sceneId) {
				var scene = _getScene.apply(_this, [sceneId]);
				scene.run();
			});
			_(s.devices).each(function (device) {
				if (device.length !== 2) {
					throw new Error('Invalid device configuration!');
				}
				var deviceId = device[0];
				var state = device[1];
				var d = _getDevice.apply(_this, [deviceId]);
				d.setState(state);
			});
		}, sched));
	});
}

Schedule.TYPES = {
	EXACT: 'exact',
	SUNRISE: 'sunrise',
	SUNSET: 'sunset',
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

Schedule.prototype.run = function (schedule) {
	var _this = this;
	var m = moment().startOf('week');
	var days = 7;

	if (!schedule || schedule.weekly || !schedule.weekly.length) {
		throw new Error('Empty Schedule!');
	}
	_d(m.toDate(), days - 1).each(function (d) {
		var m = moment(d);
		_(schedule.weekly).each(function (w) {
			var daysToIterate = w.days && w.days.length ? w.days : ALL_DAYS;
			_(daysToIterate).each(function (day) {
				if (day !== m.day() + 1) {
					return;
				}

				var scheduleDate = _getDateFromType.apply(_this, [m, w.type]);
				var sequence = _convertToSequence.apply(_this, [w]);
				_setupScheduleSequence.apply(_this, [scheduleDate, sequence]);
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
