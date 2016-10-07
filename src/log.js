'use strict';

var _ = require('underscore');
var moment = require('moment-timezone');

var nconf = require('../config');


var LEVEL = {
    OFF: 'off',
    INFO: 'info',
    DEBUG: 'debug'
};
var BUCKETS = {};
BUCKETS[LEVEL.DEBUG] = ['VeraApi'];
var logLevel = nconf.get('log:level') || LEVEL.OFF;

function _getFormattedDate() {
    return '[' + moment().format('llll') + ']';
}

function _shouldMuteLogLine(prefix) {
    switch (logLevel) {
        case LEVEL.INFO:
            // Everything that is not labeled debug
            return _(BUCKETS[LEVEL.DEBUG]).contains(prefix);
        case LEVEL.DEBUG:
            return true;
        default:
        case LEVEL.OFF:
            return false;
    }
}

function log() {
    var args = [_getFormattedDate()];
    args.push.apply(args, arguments);
    console.log.apply(console, args);
}

log.LEVEL = LEVEL;

log.line = function (line, isStartOfLine) {
    if (isStartOfLine) {
        process.stdout.write(_getFormattedDate() + ' ');
    }
    process.stdout.write(line);
};

log.prefix = function (prefix) {
    var logPrefix = function () {
        var args = ['[' + prefix + ']'];
        if (_shouldMuteLogLine(prefix)) {
            return;
        }
        args.push.apply(args, arguments);
        log.apply(log, args);
    };

    logPrefix.line = function (line, isStartOfLine) {
        if (_shouldMuteLogLine(prefix)) {
            return;
        }
        if (isStartOfLine) {
            line = '[' + prefix + '] ' + line;
        }
        log.line.call(log, line, isStartOfLine);
    };

    return logPrefix;
};

module.exports = log;
