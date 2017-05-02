import _ from 'underscore';
import Switch from './Switch';
import DimmableSwitch from './DimmableSwitch';
import Thermostat from './Thermostat';

const DEVICE_TYPE = {
    ZWAVE_NETWORK: 'urn:schemas-micasaverde-com:device:ZWaveNetwork:1',
    SCENE_CONTROLLER: 'urn:schemas-micasaverde-com:device:SceneController:1',
    BINARY_SWITCH: 'urn:schemas-upnp-org:device:BinaryLight:1',
    DIMMABLE_SWITCH: 'urn:schemas-upnp-org:device:DimmableLight:1',
    THERMOSTAT: 'urn:schemas-upnp-org:device:HVAC_ZoneThermostat:1',
};

const deviceFactory = {
    create(api, device, bus) {
        switch (device.deviceType) {
            case DEVICE_TYPE.BINARY_SWITCH:
                return new Switch(api, device, bus);
            case DEVICE_TYPE.DIMMABLE_SWITCH:
                return new DimmableSwitch(api, device, bus);
            case DEVICE_TYPE.THERMOSTAT:
                return new Thermostat(api, device, bus);
            default:
                throw new Error(`Unknown deviceType "${deviceType}"!`);
        }
    },

    filterDevices(devices) {
        const zwaveNetwork =_(devices).findWhere({ device_type: DEVICE_TYPE.ZWAVE_NETWORK });
        return _(devices).filter(function (device) {
            return device.id_parent === zwaveNetwork.id && device.device_type !== DEVICE_TYPE.SCENE_CONTROLLER;
        });
    }
};

export default deviceFactory;
