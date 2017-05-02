'use strict';

import fs from 'fs';
import http from 'http';
import https from 'https';
import compression from 'compression';
import Express from 'express';

const log = require('debug')('App:Api');

function getSslOptions(rootApp, apiConfig) {
    const caBundle = apiConfig.caBundle || [];
    const options = {
        key: fs.readFileSync(rootApp.appDir + apiConfig.key),
        cert: fs.readFileSync(rootApp.appDir + apiConfig.cert),
        ca: []
    };

    caBundle.forEach(function (ca) {
        options.ca.push(fs.readFileSync(rootApp.appDir + ca));
    });

    return options;
}

function createServer (rootApp, apiConfig) {
    const port = apiConfig.port;
    const expressApp = new Express();

    expressApp.set('view engine', 'ejs');
    expressApp.set('views', './web/views');

    expressApp.set('x-powered-by', false);

    expressApp.use(compression());

    expressApp.use(function (req, res, next) {
        if (!apiConfig.isSecure || req.secure) {
            return next();
        };
        res.redirect('https://' + req.get('host') + req.url);
    });

    // Static Files
    expressApp.use(Express.static('./web/public'));

    expressApp.use('/api', require('./routes/api')(rootApp, apiConfig));


    expressApp.get('*', function (req, res) {
        res.render('index');
    });

    expressApp.use(function(err, req, res, next){
        var msg = err.message || 'Error!';

        log(err.stack);
        res.status(500).send({ error: msg });
    });

    let server;
    if (apiConfig.isSecure) {
        server = https.createServer(getSslOptions(rootApp, apiConfig), expressApp);
    } else {
        server = http.createServer(expressApp);
    }
    server.listen(port);

    log('Listening' + (apiConfig.isSecure ? ' securely' : '') + ' on port ' + port + '...');
}

module.exports = createServer;
