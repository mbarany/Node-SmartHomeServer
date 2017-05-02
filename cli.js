#! /usr/bin/env node

require('babel-register')({
    "presets": ["es2015"]
});

const log = require('debug')('App:Boot');
const JsonCache = require('./src/JsonCache');
const Cli = require('./src/Cli');
const App = require('./src/App');
const nconf = require('./config');


const appDir = `${require('path').dirname(require.main.filename)}/`;
const cache = new JsonCache(`${appDir}cache/`);
const app = new App(nconf, appDir, cache);

app.load().then(() => {
    const cli = new Cli(app);
    return cli.execute(nconf);
}).fail(err => {
    log(err);
});
