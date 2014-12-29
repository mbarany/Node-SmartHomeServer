'use strict';

var _ = require("underscore");

var log = require('./src/log');
var JsonCache = require('./src/JsonCache');
var Cli = require('./src/Cli');
var App = require('./src/App');
var nconf = require('nconf');
var config = require('./config/config');


var appDir = require('path').dirname(require.main.filename) + '/';
var cache = new JsonCache(appDir + 'cache/');
var app;


nconf.argv()
    .env()
    .defaults(config);

app = new App(nconf, appDir, cache);
app.load().then(function () {
    var cli = new Cli(app);
    return cli.execute(nconf);
}).fail(function (err) {
    log(err);
});
