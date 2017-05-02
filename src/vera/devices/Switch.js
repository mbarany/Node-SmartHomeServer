import _ from 'underscore';
import AbstractDevice from './AbstractDevice';
import ApiService from './ApiService';


const SERVICES = {
    SWITCH: new ApiService(
        'urn:upnp-org:serviceId:SwitchPower1',
        'SetTarget',
        'newTargetValue'
    ),
};

class Switch extends AbstractDevice {
    on() {
        return this._action(SERVICES.SWITCH, 1).then(() => {
            this.setStatus(1);
        });
    }

    off() {
        return this._action(SERVICES.SWITCH, 0).then(() => {
            this.setStatus(0);
        });
    }

    getStatus() {
        return this.status ? 'On' : 'Off';
    }

    hasStatus(state) {
        const status = state === 'on' ? 1 : 0;
        return this.status === status;
    }

    setState(state) {
        switch (state) {
            case 'on':
                return this.on();
            case 'off':
                return this.off();
        }
        throw new Error(`Invalid state for value "${value}"!`);
    }

    parseStates(states) {
        const state = _(states).where({
            service: SERVICES.SWITCH.serviceId,
            variable: 'Status'
        });

        if (state.length) {
            const newStatus = parseInt(state[0].value, 10);
            this.setStatus(newStatus);
        }
    }
}

export default Switch;
