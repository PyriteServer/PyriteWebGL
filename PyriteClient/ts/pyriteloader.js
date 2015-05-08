var PyriteLoader = (function () {
    function PyriteLoader(p) {
        this.loadTexture = function (dl, cube, callback) {
            var textureCoords = dl.TextureCoordinatesForCube(cube.X, cube.Y);
            var textureUrl = dl.Query.GetTexturePath(dl.Name, textureCoords.x, textureCoords.y);
            var that = this;
            dl.TextureKey = textureUrl;
            console.log("load texture: ");
            THREE.ImageUtils.crossOrigin = 'anonymous';
            THREE.ImageUtils.loadTexture(textureUrl, THREE.UVMapping, callback);
        };
        this.loadObj = function (dl, cube) {
            console.log("loadObj");
            cube.load(this.pyrite.scene);
            //var textureCoords = dl.TextureCoordinatesForCube(cube.X, cube.Y);
            //var textureUrl = dl.Query.GetTexturePath(dl.Name, textureCoords.x, textureCoords.y);
            //cube.TextureKey = textureUrl;
            //var geometryUrl = dl.Query.GetModelPath(dl.Name, cube.X, cube.Y, cube.Z);
            //var that = this;
            //that.objLoader.load(geometryUrl + "?fmt=obj",(o) => {
            //    dl.Obj = o;
            //    o.traverse((child) => {
            //        if (child instanceof THREE.Mesh) {
            //            THREE.ImageUtils.crossOrigin = 'anonymous';
            //            THREE.ImageUtils.loadTexture(textureUrl, THREE.UVMapping, function (texture) {
            //                console.log("begin loadTexture callback");
            //                console.log("cube - " + cube.X + "," + cube.Y + "," + cube.Z);
            //                console.log("cube texture key - " + cube.TextureKey);
            //                console.log("texture url - " + texture.image.src);
            //                var material = new THREE.MeshBasicMaterial();
            //                //material.map = new THREE.Texture(image);
            //                material.map = texture;
            //                //material.map.mapping = THREE.UVMapping;
            //                material.map.needsUpdate = true;
            //                material.needsUpdate = true;
            //                child.material = material;
            //            }, function (error) { console.log(error); });
            //        }
            //    });
            //    that.pyrite.scene.add(o);
            //    //that.pyrite.render();
            //    console.log("loaded obj: " + geometryUrl);
            //});
        };
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
    PyriteLoader.prototype.loadTextures = function (dl, callback) {
        var cubes = dl.Cubes;
        var that = this;
        for (var i = 0; i < cubes.length; i++) {
        }
    };
    PyriteLoader.prototype.loadObjs = function (dl) {
        var cubes = dl.Cubes;
        var that = this;
        var manager = new THREE.LoadingManager();
        var objLoader = new THREE.OBJLoader(manager);
        for (var i = 0; i < cubes.length; i++) {
            var textureCoords = dl.TextureCoordinatesForCube(cubes[i].X, cubes[i].Y);
            var textureUrl = dl.Query.GetTexturePath(dl.Name, textureCoords.x, textureCoords.y);
            that.loadObj(dl, cubes[i]);
        }
    };
    PyriteLoader.prototype.onLoaded = function (dl) {
        if (dl.Value == Config.lod) {
            this.pyrite.dl = dl;
            this.loadObjs(dl);
        }
    };
    return PyriteLoader;
})();
//# sourceMappingURL=pyriteloader.js.map