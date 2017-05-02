import _ from 'underscore';
import Switch from './Switch';
import ApiService from './ApiService';


const SERVICES = {
    DIMMER: new ApiService(
        'urn:upnp-org:serviceId:Dimming1',
        'SetLoadLevelTarget',
        'newLoadlevelTarget'
    ),
};

class DimmableSwitch extends Switch {
    on() {
        return this.dim(100);
    }

    off() {
        return this.dim(0);
    }

    setState(state) {
        const value = parseInt(state, 10);
        if (!isNaN(value)) {
            return this.dim(value);
        }
        return super.setState(state);
    }

    dim(value) {
        const validRange = _.range(0, 101);
        value = parseInt(value, 10);
        if (!_(validRange).contains(value)) {
            throw new Error(`Invalid dim value for "${value}"!`);
        }
        return this._action(SERVICES.DIMMER, value).then(() => {
            this.setStatus(value);
        });
    }

    getStatus() {
        return this.status ? `${this.status}% On` : 'Off';
    }

    hasStatus(state) {
        if (_.isNumber(state)) {
            return this.status === state;
        }
        const status = state === 'on' ? 100 : 0;
        return this.status === status;
    }

    parseStates(states) {
        const state = _(states).where({
            service: SERVICES.DIMMER.serviceId,
            variable: 'LoadLevelStatus'
        });

        if (state.length) {
            const newStatus = parseInt(state[0].value, 10);
            this.setStatus(newStatus);
        }
    }
}

export default DimmableSwitch;
