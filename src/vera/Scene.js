class Scene {
    constructor(api, sceneId, sceneName) {
        this.api = api;
        this.sceneId = sceneId;
        this.sceneName = sceneName;
        return this;
    }

    getId() {
        return this.sceneId;
    }

    getName() {
        return this.sceneName;
    }

    run() {
        return _action.call(this);
    }
}

function _action() {
    return this.api.action({
        serviceId: 'urn:micasaverde-com:serviceId:HomeAutomationGateway1',
        SceneNum: this.getId(),
    }, 'RunScene');
}

export default Scene;
