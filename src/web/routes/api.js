var router = require('express').Router();
var auth = require('basic-auth');
var _ = require('underscore');


var app;

function validateUser (user) {
    var accessTokens = app.config.api.accessTokens || [];

    if (!user || !user.name || user.pass !== '') {
        return false;
    }
    return _(accessTokens).contains(user.name);
}

router.use(function(req, res, next) {
    var user = auth(req);

    if (validateUser(user)) {
        next();
    } else {
        res.sendStatus(401);
    }
});

router.post('/device/:deviceId/:newState', function (req, res) {
    var deviceId = req.params.deviceId;
    var newState = req.params.newState;

    app.executeDevice(deviceId, newState);
    res.send('Done.');
});

router.post('/scene/:sceneId', function (req, res) {
    var sceneId = req.params.sceneId;

    app.executeScene(sceneId);
    res.send('Done.');
});

module.exports = function (rootApp) {
    app = rootApp;
    return router;
};
