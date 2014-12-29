'use strict';

var _ = require('underscore');
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

log.prefix = function (prefix) {
    var logPrefix = function () {
        var args = ['[' + prefix + ']'];
        args.push.apply(args, arguments);
        log.apply(log, args);
    };

    logPrefix.line = function (line, isStartOfLine) {
        if (isStartOfLine) {
            line = '[' + prefix + '] ' + line;
        }
        log.line.call(log, line, isStartOfLine);
    };

    return logPrefix;
};

module.exports = log;
