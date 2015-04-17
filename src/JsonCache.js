'use strict';

var jsonfile = require('jsonfile');
var fs = require('fs');
var Q = require('q');
var moment = require('moment-timezone');


var JsonCache = function (cacheDir) {
    this.cacheDir = cacheDir;
};

function _getCacheFile(key) {
    return this.cacheDir + key + '.json';
}

function _readFile(filename) {
    var deferred = Q.defer();

    jsonfile.readFile(filename, { throws: false }, function (err, obj) {
        if (!err && obj) {
            deferred.resolve(obj);
        } else {
            deferred.reject();
        }
    });
    return deferred.promise;
}

function _getModifiedTime(filename) {
    var deferred = Q.defer();

    fs.stat(filename, function (err, stats) {
        var m = moment(stats.mtime);
        var now = moment();
        var seconds = moment.duration(now.diff(m)).asSeconds();

        deferred.resolve(seconds);
    });
    return deferred.promise;
}

JsonCache.prototype.set = function (key, data) {
    var deferred = Q.defer();
    var filename = _getCacheFile.call(this, key);

    jsonfile.writeFile(filename, data, function (err) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
};

JsonCache.prototype.get = function (key, expirationInSeconds) {
    var _this = this;
    var filename = _getCacheFile.call(this, key);
    var data;

    return _readFile.call(this, filename)
        .then(function (obj) {
            data = obj;
            return _getModifiedTime.call(_this, filename);
        })
        .then(function (seconds) {
            if (typeof expirationInSeconds === 'number' && seconds > expirationInSeconds) {
                throw new Error('Expired!');
            }
            return data;
        });
};

module.exports = JsonCache;
