class CubeWorker {
    onmessage = function(geometryUrl, textureUrl) {
        var that = this;
        var loader = new EBOLoader();
        loader.load(geometryUrl + "?fmt=ebo", (mesh: THREE.Mesh) => {
            that.gettexture(textureUrl, mesh);
        });
    }

    gettexture(textureUrl, mesh: THREE.Mesh) {
        THREE.ImageUtils.crossOrigin = 'anonymous';
        THREE.ImageUtils.loadTexture(textureUrl, THREE.UVMapping, function (texture) {
            var material = new THREE.MeshBasicMaterial();
            material.map = texture;
            material.map.needsUpdate = true;
            material.needsUpdate = true;
            mesh.material = material;
            self.postMessage("", "");
        }, function (error) { console.log(error); });
    }
} 