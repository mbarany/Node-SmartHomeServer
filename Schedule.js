var _ = require('underscore');
var colors = require('colors');
var later = require('later');
var SunCalc = require('suncalc');
var moment = require('moment-timezone');

var _d = require('./date-helper');


var Schedule = function (devices, scenes, rawSchedule, location) {
    this.devices = devices;
    this.scenes = scenes;
    this.rawSchedule = rawSchedule;
    this.location = location || {};
    this._schedules = [];
    this._timers = [];
    return this;
};

var ALL_DAYS = _.range(1, 8);
var DEFAULT_TIMEZONE = 'America/New_York';
var DATE_FORMAT = 'ddd, MMM D YYYY, hh:mm:ssa z';

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
}

function _getDateFromType(m, type) {
    switch (type) {
        case Schedule.TYPES.EXACT:
            return moment(m);
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
}

function _getDevice(deviceId) {
    if (!this.devices[deviceId]) {
        throw new Error('Device not found with id "' + deviceId + '"!');
    }
    return this.devices[deviceId];
}

function _setupSchedule() {
    var _this = this;
    var schedule = this.rawSchedule;
    var m = moment().tz(this.getTimezone()).startOf('week');

    if (!schedule || !schedule.weekly || !schedule.weekly.length) {
        throw new Error('Empty Schedule!');
    }

    for (var i = 0; i < 7; i++) {
        _(schedule.weekly).each(function (w) {
            var daysToIterate = w.days && w.days.length ? w.days : ALL_DAYS;
            _(daysToIterate).each(function (day) {
                if (day !== m.day() + 1) {
                    return;
                }

                var scheduleDate = _getDateFromType.call(_this, m, w.type);
                var sequence = _convertToSequence.call(_this, w);
                _setupScheduleSequence.call(_this, scheduleDate, sequence);
            });
        });
        m.add(1, 'days');
    }
}

function _setupScheduleSequence(scheduleDate, sequence) {
    var _this = this;
    _(sequence).each(function (s) {
        scheduleDate.add(s.at, 'minutes');
        var sched = _convertMomentToSchedule(scheduleDate);
        _this._schedules.push({
            schedule: sched,
            scenes: s.scenes,
            devices: s.devices,
        });
    });
}

function _setupTimers() {
    var _this = this;
    _(this._schedules).each(function (s) {
        _this._timers.push(later.setTimeout(function () {
            _(s.scenes).each(function (sceneId) {
                var scene = _getScene.call(_this, sceneId);
                scene.run();
            });
            _(s.devices).each(function (device) {
                if (device.length !== 2) {
                    throw new Error('Invalid device configuration!');
                }
                var deviceId = device[0];
                var state = device[1];
                var d = _getDevice.call(_this, deviceId);
                d.setState(state);
            });
        }, s.schedule));
    });
}

function _printSchedule() {
    var _this = this;
    _(this._schedules).each(function (s) {
        var scenes = _(s.scenes).map(function (sceneId) {
            var scene = _getScene.call(_this, sceneId);
            return scene.getName();
        });
        var devices = _(s.devices).map(function (device) {
            var deviceId = device[0];
            var state = device[1];
            var d = _getDevice.call(_this, deviceId);
            return d.getName() + '(' + state + ')';
        });

        var nextDate = later.schedule(s.schedule).next(1);
        var nextMoment = moment.tz(nextDate, _this.getTimezone());
        console.log(nextMoment.format(DATE_FORMAT).bold.underline);
        if (scenes.length) {
            console.log('  Scenes:');
            console.log('    ' + scenes.join(', '));
        }
        if (devices.length) {
            console.log('  Devices:');
            console.log('    ' + devices.join(', '));
        }
        console.log('');
    });
}

Schedule.TYPES = {
    EXACT: 'exact',
    SUNRISE: 'sunrise',
    SUNSET: 'sunset',
};

Schedule.prototype.getLat = function () {
    if (!this.location.lat) {
        throw new Error('lat not found!');
    }
    return this.location.lat;
};

Schedule.prototype.getLon = function () {
    if (!this.location.lon) {
        throw new Error('lon not found!');
    }
    return this.location.lon;
};

Schedule.prototype.getTimezone = function () {
    return this.location.timezone || DEFAULT_TIMEZONE;
};

Schedule.prototype.preview = function () {
    _setupSchedule.call(this);
    _printSchedule.call(this);
};

Schedule.prototype.run = function () {
    _setupSchedule.call(this);
    _setupTimers.call(this);
};

Schedule.prototype.clearTimers = function () {
    _(this._timers).each(function (timer) {
        timer.clear();
    });
    this._timers = [];
};

module.exports = Schedule;
