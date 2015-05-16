class PyriteLoader {
    pyrite : Pyrite;
    query: PyriteQuery;
    dl: PyriteDetailLevel;

    constructor(p: Pyrite) {
        this.pyrite = p;
        this.query = new PyriteQuery(this);
    }

    load() {
        this.query.loadAll();
        console.log("cube query complete");
    }

    update(camera: THREE.Camera) {
        if (this.dl) this.dl.update(camera);
    }

    onLoaded(dl: PyriteDetailLevel) {
        if (dl.Value == Config.lod) {
            this.dl = dl;
            this.dl.loadCubes();
        }
    }

    loadInitialLOD(dl: PyriteDetailLevel) {

    }
} 