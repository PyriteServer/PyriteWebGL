var PyriteCube = (function () {
    function PyriteCube(dl) {
        this.DetailLevel = dl;
    }
    PyriteCube.prototype.isRendered = function (render, scene) {
        if (render) {
            if (!scene.getChildByName(this.Obj.name)) {
                scene.add(this.Obj);
            }
        }
        else {
            if (scene.getChildByName(this.Obj.name)) {
                scene.remove(this.Obj);
            }
        }
    };
    // loads the mesh and textures and adds them to the scene
    PyriteCube.prototype.load = function (scene) {
        var _this = this;
        var textureCoords = this.DetailLevel.TextureCoordinatesForCube(this.X, this.Y);
        var textureUrl = this.DetailLevel.Query.GetTexturePath(this.DetailLevel.Name, textureCoords.x, textureCoords.y);
        this.TextureKey = textureUrl;
        var geometryUrl = this.DetailLevel.Query.GetModelPath(this.DetailLevel.Name, this.X, this.Y, this.Z);
        var that = this;
        // jasfox - was trying for loading EBO files
        //var loader = new THREE.BinaryLoader();
        //loader.load(geometryUrl, (o) => {
        //    this.Obj = o;
        //});
        var objLoader = new THREE.OBJLoader();
        objLoader.load(geometryUrl + "?fmt=obj", function (o) {
            _this.Obj = o;
            _this.Obj.name = _this.X + "_" + _this.Y + "_" + _this.Z;
            o.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    THREE.ImageUtils.crossOrigin = 'anonymous';
                    THREE.ImageUtils.loadTexture(textureUrl, THREE.UVMapping, function (texture) {
                        console.log("begin loadTexture callback");
                        console.log("cube - " + this.X + "," + this.Y + "," + this.Z);
                        console.log("cube texture key - " + this.TextureKey);
                        console.log("texture url - " + texture.image.src);
                        var material = new THREE.MeshBasicMaterial();
                        //material.map = new THREE.Texture(image);
                        material.map = texture;
                        //material.map.mapping = THREE.UVMapping;
                        material.map.needsUpdate = true;
                        material.needsUpdate = true;
                        child.material = material;
                    }, function (error) {
                        console.log(error);
                    });
                }
            });
            that.DetailLevel.Octree.add(o, null);
            scene.add(o);
            //that.pyrite.render();
            console.log("loaded obj: " + geometryUrl);
        });
    };
    return PyriteCube;
})();
//# sourceMappingURL=pyritecube.js.map