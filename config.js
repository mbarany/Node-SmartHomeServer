'use strict';

var _ = require('underscore');
var nconf = require('nconf');
var defaultConfig = require('./config/config.defaults');
var userConfig = require('./config/config');
var userSchedule = require('./config/schedule');


var config = _.extend({}, defaultConfig, userConfig);

nconf.argv()
    .env()
    .use('memory')
    .defaults(config)
    .set('schedule', userSchedule);

module.exports = nconf;
