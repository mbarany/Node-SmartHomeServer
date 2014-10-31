var _ = require("underscore");

var config = require('./config/config');
var App = require('./App');


var args = _(process.argv).rest(2);
var app = new App(_.clone(config));

try {
	app.execute.apply(app, args);
} catch (e) {
	console.log('');
	console.log(e);
}
