import _ from 'underscore';
import later from 'later';
import SunCalc from 'suncalc';
import moment from 'moment-timezone';


const ALL_DAYS = _.range(1, 8);
const DEFAULT_TIMEZONE = 'America/New_York';
const DATE_FORMAT = 'llll z';

const TYPES = {
    EXACT: 'exact',
    SUNRISE: 'sunrise',
    SUNSET: 'sunset',
};

class Schedule {
    constructor(controller, scenes, rawSchedule, location) {
        this.controller = controller;
        this.scenes = scenes;
        this.rawSchedule = rawSchedule;
        this.location = location || {};
        this._schedules = [];
        return this;
    }

    getLat() {
        if (!this.location.lat) {
            throw new Error('lat not found!');
        }
        return this.location.lat;
    }

    getLon() {
        if (!this.location.lon) {
            throw new Error('lon not found!');
        }
        return this.location.lon;
    }

    getTimezone() {
        return this.location.timezone || DEFAULT_TIMEZONE;
    }

    getStartOfWeek(page) {
        return moment()
            .add(7 * (page - 1), 'days')
            .tz(this.getTimezone())
            .startOf('week');
    }

    preview(page) {
        _setupSchedule.call(this);
        return _previewSchedule.call(this, page);
    }

    run() {
        _setupSchedule.call(this);
        _setupTimers.call(this);
    }
}

function _convertMomentToSchedule(m) {
    const d = m.clone().toDate();
    return later.parse.recur()
        .on(later.hour.val(d)).hour()
        .on(later.minute.val(d)).minute()
        .on(later.dayOfWeek.val(d)).dayOfWeek();
}

function _convertToSequence(weeklySchedule) {
    if (weeklySchedule.sequence) {
        return weeklySchedule.sequence;
    }

    const sequence = {
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
    const mm = m.clone();
    mm.set('hour', 12); //hack: set to mid-day to get correct times
    return SunCalc.getTimes(mm.toDate(), this.getLat(), this.getLon());
}

function _getDateFromType(m, type) {
    switch (type) {
        case TYPES.EXACT:
            return m.clone();
        case TYPES.SUNSET:
            return moment(_getTimes.call(this, m).sunset);
        case TYPES.SUNRISE:
            return moment(_getTimes.call(this, m).sunrise);
        default:
            throw new Error(`Invalid type "${type}"!`);
    }
}

function _getScene(sceneId) {
    if (!this.scenes[sceneId]) {
        throw new Error(`Scene not found with id "${sceneId}"!`);
    }
    return this.scenes[sceneId];
}

function _getDevice(deviceId) {
    if (!this.controller.devices[deviceId]) {
        throw new Error(`Device not found with id "${deviceId}"!`);
    }
    return this.controller.devices[deviceId];
}

function _setupScheduleSequence(scheduleDate, sequence) {
    const _this = this;
    _(sequence).each(s => {
        scheduleDate.add(s.at, 'minutes');
        const sched = _convertMomentToSchedule.call(_this, scheduleDate);
        _this._schedules.push({
            schedule: sched,
            scenes: s.scenes,
            devices: s.devices,
        });
    });
}

function _setupSchedule() {
    const _this = this;
    const schedule = this.rawSchedule;
    const m = this.getStartOfWeek();

    if (!schedule || !schedule.weekly || !schedule.weekly.length) {
        throw new Error('Empty Schedule!');
    }

    if (this._schedules.length) {
        return;
    }

    for (let i = 0; i < 7; i++) {
        _(schedule.weekly).each(w => {
            const daysToIterate = w.days && w.days.length ? w.days : ALL_DAYS;
            _(daysToIterate).each(day => {
                if (day !== m.day() + 1) {
                    return;
                }

                const scheduleDate = _getDateFromType.call(_this, m, w.type);
                const sequence = _convertToSequence.call(_this, w);
                _setupScheduleSequence.call(_this, scheduleDate, sequence);
            });
        });
        m.add(1, 'days');
    }
}

function _setupTimers() {
    const _this = this;
    const startOfWeek = this.getStartOfWeek();
    let nextDate;

    _(this._schedules).each(s => {
        nextDate = later.schedule(s.schedule).next(1, startOfWeek);
        if (moment().isAfter(nextDate)) {
            return;
        }

        later.setTimeout(() => {
            _(s.scenes).each(sceneId => {
                const scene = _getScene.call(_this, sceneId);
                scene.run();
            });
            _(s.devices).each(device => {
                if (device.length !== 2) {
                    throw new Error('Invalid device configuration!');
                }
                const deviceId = device[0];
                const state = device[1];
                const d = _getDevice.call(_this, deviceId);
                d.setState(state);
            });
        }, s.schedule);
    });
}

function _previewSchedule(page) {
    const _this = this;
    const startOfWeek = this.getStartOfWeek(page);
    const scheduleStartDate = startOfWeek.toDate();
    const preview = {
        title: `${startOfWeek.year()} schedule for Week #${startOfWeek.week()}`,
        events: [],
    };

    _(this._schedules).each(s => {
        const scenes = _(s.scenes).map(sceneId => {
            const scene = _getScene.call(_this, sceneId);
            return scene.getName();
        });
        const devices = _(s.devices).map(device => {
            const deviceId = device[0];
            const state = device[1];
            const d = _getDevice.call(_this, deviceId);
            return `${d.getName()} (${state})`;
        });
        const nextDate = later.schedule(s.schedule).next(1, scheduleStartDate);
        const nextMoment = moment.tz(nextDate, _this.getTimezone());

        preview.events.push({
            timestamp: nextMoment.unix(),
            date: nextMoment.format(DATE_FORMAT),
            scenes: scenes.length ? scenes.join(', ') : '',
            devices: devices.length ? devices.join(', ') : '',
        });
    });
    preview.events = _.sortBy(preview.events, 'timestamp');
    return preview;
}

module.exports = Schedule;
