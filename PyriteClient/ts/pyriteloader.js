var PyriteLoader = (function () {
    function PyriteLoader(p) {
        this.pyrite = p;
        this.query = new PyriteQuery(this);
    }
    PyriteLoader.prototype.load = function () {
        this.query.loadAll();
        console.log("cube query complete");
    };
    PyriteLoader.prototype.update = function (camera) {
        if (this.dl)
            this.dl.update(camera);
    };
    PyriteLoader.prototype.onLoaded = function (dl) {
        if (dl.Value == Config.lod) {
            this.dl = dl;
            this.dl.loadCubes();
        }
    };
    return PyriteLoader;
})();
//# sourceMappingURL=pyriteloader.js.map