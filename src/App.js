import _ from 'underscore';
import later from 'later';
import Q from 'q';
import Pushbullet from 'pushbullet';

import errors from './errors';
import VeraApi from './vera/Api';
import VeraController from './vera/Controller';
import VeraScene from './vera/Scene';
import Schedule from './Schedule';
import webServer from './web/server';
const log = require('debug')('App:App');


class App {
    constructor(nconf, appDir, cache) {
        this.appDir = appDir;
        this.cache = cache;
        this.api = new VeraApi(nconf.get('vera:api'), this.appDir, this.cache);
        this.scenes = _(nconf.get('vera:scenes')).map((value, key) => new VeraScene(this.api, value, key));
        this.controller = new VeraController(this.api, this.cache);
        this.schedule = new Schedule(this.controller, this.scenes, nconf.get('schedule'), nconf.get('location'));
        this.apiServerConfig = nconf.get('api');
        this.pushbulletConfig = nconf.get('pushbullet');
    }

    load() {
        return new Q();
    }

    executeDevice(deviceId, state) {
        return this.controller.load().then(() => {
            const device = this.controller.devices[deviceId];
            if (!device) {
                throw new errors.ClientError('Invalid device id!');
            }
            device.setState(state);
        });
    }

    executeScene(sceneId) {
        const scene = this.scenes[sceneId];
        if (!scene) {
            throw new Error('Invalid scene id!');
        }
        return scene.run();
    }

    startServer() {
        const _this = this;
        const startOfWeek = this.schedule.getStartOfWeek().toDate();
        const sched = later.parse.recur()
            .on(later.dayOfWeek.val(startOfWeek)).dayOfWeek()
            .on(later.hour.val(startOfWeek)).hour()
            .on(later.minute.val(startOfWeek)).minute();

        return this.controller.load().then(() => {
            _setupSchedule.call(_this);
            // Run weekly
            later.setInterval(() => {
                _setupSchedule.call(_this);
            }, sched);

            if (_this.apiServerConfig.disabled) {
                return;
            }
            log('Starting API Server...');
            webServer(_this, _this.apiServerConfig);
            log('Done.');
            if (_this.pushbulletConfig.accessToken && _this.pushbulletConfig.device) {
                sendStartNotif.call(_this, _this.pushbulletConfig);
            }
        });
    }

    previewSchedule(page) {
        return this.controller.load().then(() => this.schedule.preview(page));
    }
}

function _setupSchedule() {
    log('Setting up schedule...');
    this.schedule.run();
    log('Done.');
}

function sendStartNotif(config) {
    const pusher = new Pushbullet(config.accessToken);
    pusher.note(config.device, 'Smarthome Server', 'The server has started', (error, response) => {});
}

module.exports = App;
