'use strict';

var express = require('express');
var _ = require('underscore');
var https = require('https');
var fs = require('fs');
var compression = require('compression');

var log = require('../log').prefix('Api');


function getSslOptions(rootApp, apiConfig) {
    var options = {
        key: fs.readFileSync(rootApp.appDir + apiConfig.key),
        cert: fs.readFileSync(rootApp.appDir + apiConfig.cert),
        ca: []
    };

    _(apiConfig.caBundle).each(function (ca) {
        options.ca.push(fs.readFileSync(rootApp.appDir + ca));
    });

    return options;
}

function createServer (rootApp, apiConfig) {
    var port = apiConfig.port;
    var server = express();
    var secureServer;

    if (apiConfig.isSecure) {
        secureServer = https.createServer(getSslOptions(rootApp, apiConfig), server);
    }

    server.set('x-powered-by', false);

    server.use(compression());

    server.use('/api', require('./routes/api')(rootApp, apiConfig));

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
