var PyriteLoader = (function () {
    function PyriteLoader(p) {
        this.loadType = 0 /* CameraDetection */;
        this.lastCameraPos = new THREE.Vector3();
        this.detectionChangeDistance = 100;
        this.upgradeConstant = 0.0;
        this.upgradeFactor = 1.05;
        this.downgradeConstant = 0.0;
        this.downgradeFactor = 1.05;
        this.pyrite = p;
        this.query = new PyriteQuery(this);
    }
    PyriteLoader.prototype.load = function () {
        if (this.loadType == 0 /* CameraDetection */ || this.loadType == 2 /* Octree */) {
            //this.query.
            this.query.loadAll();
        }
        else {
            this.query.load3x3("L2", this.pyrite.camera.position);
        }
    };
    PyriteLoader.prototype.update = function (camera) {
        if (this.query) {
            switch (this.loadType) {
                case 0 /* CameraDetection */:
                    this.updateCameraDetection(camera);
                    break;
                case 2 /* Octree */:
                    this.updateOctree(camera);
                    break;
                case 1 /* ThreeByThree */:
                    this.updateThreeByThree(camera);
                    break;
            }
            ;
        }
    };
    PyriteLoader.prototype.updateCameraDetection = function (camera) {
        if (this.lastCameraPos.distanceTo(camera.position) > this.detectionChangeDistance) {
            //if (this.query) this.query.load3x3("L2", camera.position);
            this.query.update(camera);
        }
    };
    PyriteLoader.prototype.updateThreeByThree = function (camera) {
        if (this.lastCameraPos.distanceTo(camera.position) > this.detectionChangeDistance) {
            if (this.query)
                this.query.load3x3("L2", camera.position);
        }
    };
    PyriteLoader.prototype.updateOctree = function (camera) {
        if (this.lastCameraPos.distanceTo(camera.position) > this.detectionChangeDistance) {
            if (this.query)
                this.query.load3x3("L2", camera.position);
        }
    };
    PyriteLoader.prototype.addUpgradedDetectorCubes = function (cube) {
    };
    PyriteLoader.prototype.onLoaded = function (dl) {
        //if (dl.Value == Config.lod) {
        //    this.dl = dl;
        //    this.dl.loadCubes();
        //}
    };
    PyriteLoader.prototype.loadInitialLOD = function (dl) {
    };
    return PyriteLoader;
})();
var LoadType;
(function (LoadType) {
    LoadType[LoadType["CameraDetection"] = 0] = "CameraDetection";
    LoadType[LoadType["ThreeByThree"] = 1] = "ThreeByThree";
    LoadType[LoadType["Octree"] = 2] = "Octree";
})(LoadType || (LoadType = {}));
//# sourceMappingURL=pyriteloader.js.map