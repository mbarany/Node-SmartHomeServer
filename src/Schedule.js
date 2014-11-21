var _ = require('underscore');
var later = require('later');
var SunCalc = require('suncalc');
var moment = require('moment-timezone');
require('colors');


var Schedule = function (controller, scenes, rawSchedule, location) {
    this.controller = controller;
    this.scenes = scenes;
    this.rawSchedule = rawSchedule;
    this.location = location || {};
    this._schedules = [];
    return this;
};

var ALL_DAYS = _.range(1, 8);
var DEFAULT_TIMEZONE = 'America/New_York';
var DATE_FORMAT = 'llll z';

function _convertMomentToSchedule(m) {
    var d = m.clone().toDate();
    return later.parse.recur()
        .on(later.hour.val(d)).hour()
        .on(later.minute.val(d)).minute()
        .on(later.dayOfWeek.val(d)).dayOfWeek();
}

function _convertToSequence(weeklySchedule) {
    if (weeklySchedule.sequence) {
        return weeklySchedule.sequence;
    }

    var sequence = {
        at: weeklySchedule.at,
    };
    if (weeklySchedule.devices) {
        sequence.devices = weeklySchedule.devices;
    }
    if (weeklySchedule.scenes) {
        sequence.scenes = weeklySchedule.scenes;
    }
    return [sequence];
}

function _getTimes(m) {
    var mm = m.clone();
    mm.set('hour', 12); //hack: set to mid-day to get correct times
    return SunCalc.getTimes(mm.toDate(), this.getLat(), this.getLon());
}

function _getDateFromType(m, type) {
    switch (type) {
        case Schedule.TYPES.EXACT:
            return m.clone();
        case Schedule.TYPES.SUNSET:
            return moment(_getTimes.call(this, m).sunset);
        case Schedule.TYPES.SUNRISE:
            return moment(_getTimes.call(this, m).sunrise);
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
    if (!this.controller.devices[deviceId]) {
        throw new Error('Device not found with id "' + deviceId + '"!');
    }
    return this.controller.devices[deviceId];
}

function _setupSchedule() {
    var _this = this;
    var schedule = this.rawSchedule;
    var m = this.getStartOfWeek();

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
        var sched = _convertMomentToSchedule.call(_this, scheduleDate);
        _this._schedules.push({
            schedule: sched,
            scenes: s.scenes,
            devices: s.devices,
        });
    });
}

function _setupTimers() {
    var _this = this;
    var startOfWeek = this.getStartOfWeek();
    var nextDate;

    _(this._schedules).each(function (s) {
        nextDate = later.schedule(s.schedule).next(1, startOfWeek);
        if (moment().isAfter(nextDate)) {
            return;
        }

        later.setTimeout(function () {
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
        }, s.schedule);
    });
}

function _printSchedule() {
    var _this = this;
    var startOfWeek = this.getStartOfWeek();
    var scheduleStartDate = startOfWeek.toDate();
    var title = startOfWeek.year() + ' schedule for Week #' + startOfWeek.week();

    console.log(title.green.bold.underline, '\n');
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

        var nextDate = later.schedule(s.schedule).next(1, scheduleStartDate);
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

Schedule.prototype.getStartOfWeek = function () {
    return moment().tz(this.getTimezone()).startOf('week');
};

Schedule.prototype.preview = function () {
    _setupSchedule.call(this);
    _printSchedule.call(this);
};

Schedule.prototype.run = function () {
    _setupSchedule.call(this);
    _setupTimers.call(this);
};

module.exports = Schedule;
