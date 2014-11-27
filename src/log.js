'use strict';

var moment = require('moment-timezone');


function _getFormattedDate() {
    return '[' + moment().format('llll') + ']';
}

function log() {
    var args = [_getFormattedDate()];
    args.push.apply(args, arguments);
    console.log.apply(console, args);
}

log.line = function (line, isStartOfLine) {
    if (isStartOfLine) {
        process.stdout.write(_getFormattedDate() + ' ');
    }
    process.stdout.write(line);
};

module.exports = log;
