import _ from 'underscore';
import Q from 'q';
require('colors');


const ACTIONS = {
    HELP: 'help',
    LIST: 'list',
    PREVIEW: 'preview',
};

class Cli {
    constructor(app) {
        this.app = app;
    }

    execute(nconf) {
        const args = nconf.get('_');

        if (nconf.get(ACTIONS.PREVIEW)) {
            return this.printSchedulePreview();
        }
        if (nconf.get(ACTIONS.LIST)) {
            return this.printDeviceList(nconf);
        }
        if (nconf.get(ACTIONS.HELP)) {
            return this.printUsage();
        }
        if (args.length === 2) {
            return this.app.executeDevice(args[0], args[1]);
        }
        if (args.length === 1) {
            return this.app.executeScene(args[0]);
        }
        return this.printUsage();
    }

    printUsage() {
        console.log('Usage:'.underline.bold);
        console.log(`  Display this help screen: ${'smarthome-cli --help'.yellow}`);
        console.log(`  List all devices and scenes: ${'smarthome-cli --list'.yellow}`);
        console.log(`  Preview the current schedule: ${'smarthome-cli --preview'.yellow}`);
        console.log(`  Change the state of a device: ${'smarthome-cli [deviceId] [state]'.yellow}`);
        console.log(`  Execute a scene: ${'smarthome-cli [sceneId]'.yellow}`);
        console.log('Examples:'.underline.bold);
        console.log(`  Turn den light off: ${'smarthome-cli den off'.yellow}`);
        console.log(`  Change main thermostat temperature: ${'smarthome-cli main 70'.yellow}`);
        console.log(`  Turn on all lights: ${'smarthome-cli all_lights_on'.yellow}`);

        return new Q();
    }

    printDeviceList(nconf) {
        const scenes = nconf.get('vera:scenes');
        const printer = device => {
            console.log(`  ${device.name} (${device.id}) - ${device.statusText}`);
        };

        return this.app.controller.getCategorizedDevices().then(categorizedDevices => {
            console.log('On/Off Switches:'.underline.bold);
            _(categorizedDevices.switches).each(printer);
            console.log('Dimmable Switches:'.underline.bold);
            _(categorizedDevices.dimmableSwitches).each(printer);
            console.log('Thermostats:'.underline.bold);
            _(categorizedDevices.thermostats).each(printer);

            //@todo get Scenes from API
            console.log('Scenes:'.underline.bold);
            _(scenes).each((value, key) => {
                console.log(`  ${key} (${value})`);
            });
        });
    }

    printSchedulePreview() {
        return this.app.previewSchedule().then(preview => {
            console.log(preview.title.green.bold.underline, '\n');
            _(preview.events).each(e => {
                console.log(e.date.bold.underline);
                if (e.scenes.length) {
                    console.log('  Scenes:');
                    console.log(`    ${e.scenes}`);
                }
                if (e.devices.length) {
                    console.log('  Devices:');
                    console.log(`    ${e.devices}`);
                }
                console.log('');
            });
        });
    }
}

module.exports = Cli;
