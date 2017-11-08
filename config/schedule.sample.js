// Rename to schedule.js and modify to your liking

var switches = { //This is the device id in the Vera system
    living_room: 6,
    dining_room: 7,
    master_bedroom: 8,
};
var thermostats = { //This is the device id in the Vera system
    main: 9,
};
var scenes = { //This is the scene id in the Vera system
    all_lights_on: 2,
    all_lights_off: 3,
};

module.exports = {
    weekly: [
        //One time events
        //===============
        // Run scene to turn on all lights at 12pm on the weekends
        { days: [1,7], type: 'exact', at: 12 * 60, scenes: [scenes.all_lights_on] },
        // Dim the living room lights to 60% on the weekends at 1 hour and 15 minutes after sunrise
        { days: [1,7], type: 'sunrise', at: 1.25 * 60, devices: [[switches.living_room, 60]] },
        // Turn on the master bedroom lights on the weekdays at 1 hour and 15 minutes before sunset
        { days: [2,3,4,5,6], type: 'sunset', at: -1.25 * 60, devices: [[switches.master_bedroom, 'on']] },

        //Sequenced events
        //================
        // Turn on the dining room lights and set temperature to 72 on thursdays at 3:09pm; Turn off lights 1 minute later
        { days: [5], type: 'exact', sequence: [
            { at: 15 * 60 + 9, devices: [
                [switches.dining_room, 'on'],
                [thermostats.main, 72],
            ]},
            { at: 1, devices: [
                [switches.dining_room, 'off'],
            ]},
        ]},
    ]
};
