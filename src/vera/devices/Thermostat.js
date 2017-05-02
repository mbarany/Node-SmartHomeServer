import _ from 'underscore';
import AbstractDevice from './AbstractDevice';
import ApiService from './ApiService';


const SERVICES = {
    MODE: new ApiService(
        'urn:upnp-org:serviceId:HVAC_UserOperatingMode1',
        'SetModeTarget',
        'NewModeTarget'
    ),
    TEMPERATURE: new ApiService(
        'urn:upnp-org:serviceId:TemperatureSetpoint1',
        'SetCurrentSetpoint',
        'NewCurrentSetpoint'
    ),
};

class Thermostat extends AbstractDevice {
    setState(state) {
        let value = parseInt(state, 10);
        if (!isNaN(value)) {
            return this.temperature(value);
        }
        switch (state) {
            case 'heatOn':
                return this.heatOn();
            case 'coolOn':
                return this.coolOn();
            case 'off':
                return this.off();
        }
        throw new Error(`Invalid state for value "${value}"!`);
    }

    temperature(value) {
        return this._action(SERVICES.TEMPERATURE, value).then(() => {
            this.setStatus(_.extend({ temperature: value }, this.status));
        });
    }

    getStatus() {
        if (this.status.mode !== 'Off') {
            return `${this.status.mode} ${this.status.temperature}°F`;
        }
        return 'Off';
    }

    hasStatus(state) {
        if (_.isNumber(state)) {
            return this.status.temperature === state;
        }
        return this.status.mode.toLowerCase() === state.toLowerCase();
    }

    off() {
        return this._action(SERVICES.MODE, 'Off').then(() => {
            this.setStatus(_.extend({ mode: 'Off' }, this.status));
        });
    }

    heatOn() {
        return this._action(SERVICES.MODE, 'HeatOn').then(() => {
            this.setStatus(_.extend({ mode: 'HeatOn' }, this.status));
        });
    }

    coolOn() {
        return this._action(SERVICES.MODE, 'CoolOn').then(() => {
            this.setStatus(_.extend({ mode: 'CoolOn' }, this.status));
        });
    }

    parseStates(states) {
        const stateMode = _(states).where({
            service: SERVICES.MODE.serviceId,
            variable: 'ModeStatus'
        });
        const stateTemperature = _(states).where({
            service: SERVICES.TEMPERATURE.serviceId,
            variable: 'CurrentSetpoint'
        });
        const newStatus = _.extend({}, this.status);

        if (stateMode.length) {
            newStatus.mode = stateMode[0].value;
        }
        if (stateTemperature.length) {
            newStatus.temperature = parseInt(stateTemperature[0].value, 10);
        }
        this.setStatus(newStatus);
    }
}

export default Thermostat;
