var _ = require("underscore");

var log = require('./src/log');
var JsonCache = require('./src/JsonCache');
var Cli = require('./src/Cli');
var App = require('./src/App');
var config = require('./config/config');


var args = _(process.argv).rest(2);
var cache = new JsonCache('./cache/');
var app = new App(config, cache);
var cli = new Cli(app);

app.load().then(function () {
    cli.execute.apply(cli, args);
}).fail(function (err) {
    log(err);
});
