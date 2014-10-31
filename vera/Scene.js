function _action(actionValue) {
	return this.api.action({
		serviceId: 'urn:micasaverde-com:serviceId:HomeAutomationGateway1',
		SceneNum: this.getId(),
	}, 'RunScene');
}

var Scene = function (api, sceneId) {
	this.api = api;
	this.sceneId = sceneId;
	return this;
};

Scene.prototype.getId = function () {
	return this.sceneId;
};

Scene.prototype.run = function () {
	return _action.call(this);
};

module.exports = Scene;
