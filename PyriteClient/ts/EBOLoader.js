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
        var buffer = new ArrayBuffer(text.length);
        var uint16buffer = new Uint16Array(buffer, 0, 1);
        vertexCount = uint16buffer[0] * 3;
        for (var i = 0; i < text.length; i++) {
        }
    };
    return EBOLoader;
})();
//# sourceMappingURL=EBOLoader.js.map