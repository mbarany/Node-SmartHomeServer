import http from 'http';
import compression from 'compression';
import Express from 'express';

const log = require('debug')('App:Api');

function createServer (rootApp, apiConfig) {
    const port = apiConfig.port;
    const expressApp = new Express();

    expressApp.set('view engine', 'ejs');
    expressApp.set('views', './web/views');

    expressApp.set('x-powered-by', false);

    expressApp.use(compression());

    expressApp.use(function (req, res, next) {
        if (!apiConfig.forceHttps || req.secure) {
            return next();
        };
        res.redirect('https://' + req.get('host') + req.url);
    });

    // Static Files
    expressApp.use(Express.static('./web/public'));

    expressApp.use('/api', require('./routes/api')(rootApp, apiConfig));

    expressApp.get('/', function (req, res) {
        res.render('index');
    });

    expressApp.get('*', function (req, res) {
        res.render('errors/404');
    });

    expressApp.use(function(err, req, res, next){
        var msg = err.message || 'Error!';

        log(err.stack);
        res.status(500).send({ error: msg });
    });

    const server = http.createServer(expressApp);

    server.listen(port);

    log(`Listening on port ${port} ...`);
}

module.exports = createServer;
