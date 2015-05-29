var CubeWorker = (function () {
    function CubeWorker() {
        this.onmessage = function (geometryUrl, textureUrl) {
            var that = this;
            var loader = new EBOLoader();
            loader.load(geometryUrl + "?fmt=ebo", function (mesh) {
                that.gettexture(textureUrl, mesh);
            });
        };
    }
    CubeWorker.prototype.gettexture = function (textureUrl, mesh) {
        THREE.ImageUtils.crossOrigin = 'anonymous';
        THREE.ImageUtils.loadTexture(textureUrl, THREE.UVMapping, function (texture) {
            var material = new THREE.MeshBasicMaterial();
            material.map = texture;
            material.map.needsUpdate = true;
            material.needsUpdate = true;
            mesh.material = material;
            self.postMessage("", "");
        }, function (error) {
            console.log(error);
        });
    };
    return CubeWorker;
})();
//# sourceMappingURL=cubeworker.js.map