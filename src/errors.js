require('extend-error');


const ClientError = Error.extend('ClientError');

const errors = {
    ClientError,
};

export default errors;
