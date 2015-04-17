'use strict';

var router = require('express').Router();
var auth = require('basic-auth');
var _ = require('underscore');
var Q = require('q');

var log = require('../../log').prefix('Api');
var errors = require('../../errors');


var app;
var config;

function _validateUser (user) {
    var accessTokens = config.accessTokens || [];

    if (!user || !user.name || user.pass !== '') {
        return false;
    }
    return _(accessTokens).contains(user.name);
}

function _sendError(res, err) {
    if (err instanceof errors.ClientError) {
        res.status(400);
    } else {
        res.status(500);
    }
    res.send({ error: err.message });
}

function _validateVariable (variable) {
    var validationFunctions = [].slice.call(arguments, 1);

    return Q.fcall(function () {
        var isValid = _(validationFunctions).every(function (func) {
            return func(variable);
        });
        if (!isValid) {
            throw new errors.ClientError('Not valid!');
        }
        return variable;
    });
}

function _isPositiveNumber (number) {
    return _.isFinite(number) && Number(number) > 0;
}

router.use(function(req, res, next) {
    var user = auth(req);

    if (_validateUser(user)) {
        log(req.method, req.url);
        next();
    } else {
        res.sendStatus(401);
    }
});

router.get('/devices', function (req, res) {
    app.controller.getCategorizedDevices().then(function (devices) {
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.send(devices);
    }, function (err) {
        _sendError(res, err);
    });
});

router.get('/schedule', function (req, res) {
    _validateVariable(req.query.page, _isPositiveNumber).then(function (page) {
        return app.previewSchedule(page);
    }).then(function (preview) {
        res.send(preview);
    }, function (err) {
        _sendError(res, err);
    });
});

router.post('/devices/:deviceId/:newState', function (req, res) {
    var deviceId = req.params.deviceId;
    var newState = req.params.newState;

    app.executeDevice(deviceId, newState).then(function () {
        res.send();
    }, function (err) {
        _sendError(res, err);
    });
});

router.post('/scenes/:sceneId', function (req, res) {
    var sceneId = req.params.sceneId;

    app.executeScene(sceneId).then(function () {
        res.send();
    }, function (err) {
        _sendError(res, err);
    });
});

module.exports = function (rootApp, apiConfig) {
    app = rootApp;
    config = apiConfig;
    return router;
};
