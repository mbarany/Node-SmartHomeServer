const ApiService = function () {
    if (arguments.length !== 3) {
        throw new Error('ApiService constructor requires 3 arguments!');
    }
    this.serviceId = arguments[0];
    this.action = arguments[1];
    this.value = arguments[2];
};

export default ApiService;
