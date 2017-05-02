import jsonfile from 'jsonfile';
import fs from 'fs';
import Q from 'q';
import moment from 'moment-timezone';

class JsonCache {
    constructor(cacheDir) {
        this.cacheDir = cacheDir;
    }

    set(key, data) {
        const deferred = Q.defer();
        const filename = _getCacheFile.call(this, key);

        jsonfile.writeFile(filename, data, err => {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise;
    }

    get(key, expirationInSeconds) {
        const _this = this;
        const filename = _getCacheFile.call(this, key);
        let data;

        return _readFile.call(this, filename)
            .then(obj => {
                data = obj;
                return _getModifiedTime.call(_this, filename);
            })
            .then(seconds => {
                if (typeof expirationInSeconds === 'number' && seconds > expirationInSeconds) {
                    throw new Error('Expired!');
                }
                return data;
            });
    }
}

function _getCacheFile(key) {
    return `${this.cacheDir + key}.json`;
}

function _readFile(filename) {
    const deferred = Q.defer();

    jsonfile.readFile(filename, { throws: false }, (err, obj) => {
        if (!err && obj) {
            deferred.resolve(obj);
        } else {
            deferred.reject();
        }
    });
    return deferred.promise;
}

function _getModifiedTime(filename) {
    const deferred = Q.defer();

    fs.stat(filename, (err, stats) => {
        const m = moment(stats.mtime);
        const now = moment();
        const seconds = moment.duration(now.diff(m)).asSeconds();

        deferred.resolve(seconds);
    });
    return deferred.promise;
}

module.exports = JsonCache;
