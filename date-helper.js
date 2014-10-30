function _d(startDate, endDate) {
	function F() {
    	this.startDate = startDate;
    	this.endDate = endDate instanceof Date
			? endDate
			: new Date().setDate(startDate.getDate() + endDate);;
	}
    F.prototype = _d.prototype;
    return new F();
}
_d.prototype.each = function (callback) {
	for (var d = new Date(this.startDate); d <= this.endDate; d.setDate(d.getDate() + 1)) {
	    callback(new Date(d));
	}
}

module.exports = _d;
