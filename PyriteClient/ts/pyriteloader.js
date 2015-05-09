var PyriteLoader = (function () {
    function PyriteLoader(p) {
        this.pyrite = p;
        this.query = new PyriteQuery(this);
        this.textureCache = new Dictionary([]);
        this.modelTextureMap = new Dictionary([]);
        this.objLoader = new THREE.OBJLoader();
    }
    PyriteLoader.prototype.load = function () {
        this.query.loadAll();
        console.log("cube query complete");
    };
    PyriteLoader.prototype.loadCubes = function (dl) {
        var _this = this;
        var cubes = dl.Cubes;
        var that = this;
        cubes.forEach(function (c) {
            c.load(_this.pyrite.scene);
        });
    };
    PyriteLoader.prototype.onLoaded = function (dl) {
        if (dl.Value == Config.lod) {
            this.pyrite.dl = dl;
            this.loadCubes(dl);
        }
    };
    return PyriteLoader;
})();
//# sourceMappingURL=pyriteloader.js.map