var EBOLoader = (function () {
    function EBOLoader(manager) {
    }
    EBOLoader.prototype.load = function (url, onLoad, onProgress, onError) {
        var scope = this;
        var loader = new THREE.XHRLoader(scope.manager);
        loader.setCrossOrigin(this.crossOrigin);
        loader.load(url, function (text) {
            onLoad(scope.parse(text));
        }, onProgress, onError);
    };
    EBOLoader.prototype.parse = function (text) {
        var vertexCount;
        tvertices: Array();
        tuvs: Array();
    };
    return EBOLoader;
})();
//# sourceMappingURL=EBOLoader.js.map