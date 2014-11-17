var _ = require("underscore");

var log = require('./src/log');
var Cli = require('./src/Cli');
var App = require('./src/App');
var config = require('./config/config');


var args = _(process.argv).rest(2);
var app = new App(config);
var cli = new Cli(app);

try {
    cli.execute.apply(cli, args);
} catch (e) {
    log('');
    log(e);
}
