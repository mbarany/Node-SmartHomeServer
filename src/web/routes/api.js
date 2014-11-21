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

router.get('/devices', function (req, res) {
    res.send(app.controller.getCategorizedDevices());
});

router.post('/devices/:deviceId/:newState', function (req, res) {
    var deviceId = req.params.deviceId;
    var newState = req.params.newState;

    try {
        app.executeDevice(deviceId, newState);
        res.send();
    } catch (err) {
        res.send({ error: err.message });
    }
});

router.post('/scenes/:sceneId', function (req, res) {
    var sceneId = req.params.sceneId;

    try {
        app.executeScene(sceneId);
        res.send();
    } catch (err) {
        res.send({ error: err.message });
    }
});

module.exports = function (rootApp) {
    app = rootApp;
    return router;
};
