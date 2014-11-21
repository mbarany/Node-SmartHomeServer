var _ = require("underscore");
var Q = require('q');
var fs = require('fs');
var http = require("q-io/http");
var https = require("https");
var cheerio = require("cheerio");

var log = require('../log');


var defaultParams = {
    id: 'lu_action',
    output_format: 'json',
};

var Api = function (config, cache) {
    this.config = config;
    this.cache = cache;
};

var CACHE_REMOTE_URL_SESSION = 'remote_url_session';

function _loadRemoteUrl() {
    var _this = this;

    return this.cache.get(CACHE_REMOTE_URL_SESSION, 30 * 60)
        .then(function (remoteUrlSession) {
            log('Using remoteUrlSession cache...');
            _this.remoteUrlSession = remoteUrlSession;
        }, function () {
            return _loadRemoteUrlFromApi.call(_this)
                .then(function (remoteUrlSession) {
                    _this.remoteUrlSession = remoteUrlSession;
                    log('Writing remoteUrlSession to cache...');
                    _this.cache.set(CACHE_REMOTE_URL_SESSION, _this.remoteUrlSession);
                });
        });
}

function _loadRemoteUrlFromApi() {
    var _this = this;
    var username = _this.config.username;
    var password = _this.config.password;
    var unitId = _this.config.unitId;
    var phpSessionCookie;

    return http.request(_wrapBadSSLChain.call(_this, {
            url: 'https://home.getvera.com/users/action_login',
            method: 'POST',
            body: ['login_id=' + username + '&login_pass=' + password],
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }))
        .then(function (res) {
            phpSessionCookie = _readCookie(res.headers['set-cookie'], 'PHPSESSID');
        })
        .then(function () {
            return http.request(_wrapBadSSLChain.call(_this, {
                url: 'https://home.getvera.com/device/gotoui?pk_device=' + unitId,
                method: 'GET',
                headers: {
                    Cookie: 'PHPSESSID=' + phpSessionCookie + ';'
                }
            }));
        })
        .then(function (res) {
            return res.body.read();
        })
        .then(function (body) {
            var html = body.toString();
            var $ = cheerio.load(html);
            return $('#link_device_http_' + unitId).attr('href');
        })
        .then(function (url) {
            if (!url) {
                throw new Error('Missing connect URL!');
            }
            //url will not be secure, so we don't use _wrapBadSSLChain here
            return http.request({
                url: url,
                method: 'GET',
                headers: {
                    Cookie: 'PHPSESSID=' + phpSessionCookie + ';'
                }
            });
        })
        .then(function (res) {
            return res.body.read();
        })
        .then(function (body) {
            var html = body.toString();
            var $ = cheerio.load(html);
            var auth = $('[name=devicedata_MMSAuth]').val();
            var authSig = $('[name=devicedata_MMSAuthSig]').val();
            var headers = {
                MMSProxyAuth: auth,
                MMSProxyAuthSig: authSig,
            };

            if (!auth || !authSig) {
                throw new Error('Could not get proxy auth!');
            }
            return http.request({
                url: 'https://vera-us-oem-relay41.mios.com/relay/relay/proxy?url=https%3A%2F%2Fvera-us-oem-relay41.mios.com%2Finfo%2Fsession%2Ftoken',
                method: 'GET',
                headers: headers
            });
        })
        .then(function (res) {
            return res.body.read();
        })
        .then(function (body) {
            return body.toString();
        }, function (err) {
            log(err);
        });
}

function _wrapBadSSLChain(options) {
    var defaultOpts = {
        ca: [
            fs.readFileSync('certs/gd-class2-root.crt'),
            fs.readFileSync('certs/gd_intermediate.crt')
        ]
    };
    var opts = _.extend({}, defaultOpts, options);

    opts.agent = new https.Agent(opts);
    return opts;
}

function _readCookie(cookie, cookieName) {
    var re = new RegExp('[; ]'+cookieName+'=([^\\s;]*)');
    var sMatch = (' '+cookie).match(re);
    if (cookieName && sMatch) {
        return sMatch[1];
    }
    return '';
}

function _getRemoteUrl() {
    if (!this.remoteUrlSession) {
        throw new Error('remoteUrlSession not set!');
    }
    return this.config.remoteUrl
        .replace('{{unitId}}', this.config.unitId)
        .replace('{{session}}', this.remoteUrlSession);
}

function _getUrl() {
    if (this.config.useRemote) {
        return _getRemoteUrl.call(this);
    }
    return this.config.url;
}

function _paramsToQueryString(params) {
    var urlParts = [];
    _(params).each(function (value, key) {
        urlParts.push(key + '=' + value);
    });
    return '?' + urlParts.join('&');
}

function _doRequest(url) {
    log('Url: ' + url);
    return http.request({
        url: _getUrl.call(this) + url,
        method: 'GET',
    })
    .then(function (res) {
        log('API Status: ' + res.status);
        return res.body.read();
    })
    .then(function (bodyBuffer) {
        return JSON.parse(bodyBuffer.toString());
    });
}

Api.prototype.load = function () {
    if (!this.config.useRemote) {
        return Q();
    }
    return _loadRemoteUrl.call(this);
};

Api.prototype.action = function (params, action) {
    var allParams = _.extend({}, defaultParams, params);
    var url;

    allParams.action = action;
    url = _paramsToQueryString.call(this, allParams);

    return _doRequest.call(this, url);
};

Api.prototype.userData = function () {
    var allParams = {
        id: 'user_data',
    };
    var url = _paramsToQueryString.call(this, allParams);

    return _doRequest.call(this, url);
};

module.exports = Api;
