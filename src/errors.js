require('extend-error');


var ClientError = Error.extend('ClientError');

var errors = {
    ClientError: ClientError,
};

module.exports = errors;
