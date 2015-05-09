class PyriteLoader {
    pyrite : Pyrite;
    query: PyriteQuery;
    textureCache: Dictionary;
    modelTextureMap: Dictionary;
    objLoader: THREE.OBJLoader;


    constructor(p: Pyrite) {
        this.pyrite = p;
        this.query = new PyriteQuery(this);
        this.textureCache = new Dictionary([]);
        this.modelTextureMap = new Dictionary([]);
        this.objLoader = new THREE.OBJLoader();
    }

    load() {
        this.query.loadAll();
        console.log("cube query complete");
    }


    loadCubes(dl: PyriteDetailLevel) {
        var cubes = dl.Cubes;
        var that = this;

        cubes.forEach((c) => {
            c.load(this.pyrite.scene);
        });
    }

    onLoaded(dl: PyriteDetailLevel) {
        if (dl.Value == Config.lod) {
            this.pyrite.dl = dl;
            this.loadCubes(dl);
        }
    }
} 