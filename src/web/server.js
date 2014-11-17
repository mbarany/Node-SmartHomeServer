var express = require('express');

var log = require('../log');


function createServer (rootApp) {
    var port = rootApp.config.api.port;
    var server = express();

    server.set('x-powered-by', false);

    server.use('/api', require('./routes/api')(rootApp));

    server.get('/', function (req, res) {
        res.send('Nothing to see here.')
    });

    server.use(function(err, req, res, next){
        log(err.stack);
        res.status(500).send(err.message || 'Error!');
    });

    server.listen(port);

    return server;
}

module.exports = createServer;
