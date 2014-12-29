'use strict';

var express = require('express');
var _ = require('underscore');
var https = require('https');
var fs = require('fs');

var log = require('../log').prefix('Api');


function getSslOptions(rootApp) {
    var options = {
        key: fs.readFileSync(rootApp.appDir + rootApp.config.api.key),
        cert: fs.readFileSync(rootApp.appDir + rootApp.config.api.cert),
        ca: []
    };

    _(rootApp.config.api.caBundle).each(function (ca) {
        options.ca.push(fs.readFileSync(rootApp.appDir + ca));
    });

    return options;
}

function createServer (rootApp) {
    var port = rootApp.config.api.port;
    var server = express();
    var secureServer;

    if (rootApp.config.api.isSecure) {
        secureServer = https.createServer(getSslOptions(rootApp), server);
    }

    server.set('x-powered-by', false);

    server.use('/api', require('./routes/api')(rootApp));

    server.get('/', function (req, res) {
        res.send('Nothing to see here.');
    });

    server.use(function(err, req, res, next){
        var msg = err.message || 'Error!';

        log(err.stack);
        res.status(500).send({ error: msg });
    });

    if (secureServer) {
        secureServer.listen(port);
    } else {
        server.listen(port);
    }
    log.line('Listening on port ' + port + '...');

    return server;
}

module.exports = createServer;
