import _ from 'underscore';
import ApiService from './ApiService';

class AbstractDevice {
    constructor(api, deviceData, bus) {
        if (new.target === AbstractDevice) {
            throw new TypeError('Cannot construct AbstractDevice instances directly!');
        }
        this.api = api;
        this.bus = bus;
        this.deviceId = deviceData.id;
        this.deviceName = deviceData.name;
        this.parseStates(deviceData.states);
    }

    _action(service, actionValue) {
        if (!(service instanceof ApiService)) {
            throw new Error('Invalid ApiService!');
        }
        const data = {
            serviceId: service.serviceId,
            DeviceNum: this.getId(),
        };
        data[service.value] = actionValue;

        return this.api.action(data, service.action);
    }

    getId() {
        return this.deviceId;
    }

    getName() {
        return this.deviceName;
    }

    getStatus() {
        throw new TypeError('getStatus not implemented!');
    }

    setStatus(newStatus) {
        const oldStatus = _.isObject(this.status) ? _.extend({}, this.status) : this.status;
console.log([newStatus, oldStatus]);
        if (_.isEqual(oldStatus, newStatus)) {
            return;
        }
        this.status = newStatus;
        if (oldStatus !== undefined) {
            this.bus.emit('device.change', this.getId(), newStatus, oldStatus);
        }
    }

    hasStatus() {
        throw new TypeError('hasStatus not implemented!');
    }

    setState(state) {
        throw new TypeError('setState not implemented!');
    }

    parseStates(states) {
        throw new TypeError('parseStates not implemented!');
    }
}

export default AbstractDevice;
