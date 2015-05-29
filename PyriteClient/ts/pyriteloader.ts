class PyriteLoader {
    pyrite : Pyrite;
    query: PyriteQuery;
    loadType: LoadType = LoadType.CameraDetection;
    dl: PyriteDetailLevel;
    lastCameraPos: THREE.Vector3 = new THREE.Vector3();
    detectionChangeDistance: number = 100;

    private 
    upgradeConstant = 0.0;
    upgradeFactor = 1.05;
    downgradeConstant = 0.0;
    downgradeFactor = 1.05;

    constructor(p: Pyrite) {
        this.pyrite = p;
        this.query = new PyriteQuery(this);
    }

    load() {
        if (this.loadType == LoadType.CameraDetection || this.loadType == LoadType.Octree) {
            //this.query.
            this.query.loadAll();
            //this.query.load3x3("L2", this.pyrite.camera.position);
        } else {
            this.query.load3x3("L2", this.pyrite.camera.position);
        }
    }

    update(camera: THREE.Camera) {
        if (this.query) {
            switch (this.loadType) {
                case LoadType.CameraDetection:
                    this.updateCameraDetection(camera);
                    break;
                case LoadType.Octree:
                    this.updateOctree(camera);
                    break;
                case LoadType.ThreeByThree:
                    this.updateThreeByThree(camera);
                    break;
            };
        }
    }

    updateCameraDetection(camera: THREE.Camera) {
        if (this.lastCameraPos.distanceTo(camera.position) > this.detectionChangeDistance) {
            //if (this.query) this.query.load3x3("L2", camera.position);
            this.query.update(camera);
        }
    }

    updateThreeByThree(camera: THREE.Camera) {
        if (this.lastCameraPos.distanceTo(camera.position) > this.detectionChangeDistance) {
            if (this.query) this.query.load3x3("L2", camera.position);
        }
    }

    updateOctree(camera: THREE.Camera) {
        if (this.lastCameraPos.distanceTo(camera.position) > this.detectionChangeDistance) {
            if (this.query) this.query.load3x3("L2", camera.position);
        }
    }

    addUpgradedDetectorCubes(cube: PyriteCube) {

    }

    onLoaded(dl: PyriteDetailLevel) {
        //if (dl.Value == Config.lod) {
        //    this.dl = dl;
        //    this.dl.loadCubes();
        //}
    }

    loadInitialLOD(dl: PyriteDetailLevel) {

    }
} 

enum LoadType {
    CameraDetection,
    ThreeByThree,
    Octree
}