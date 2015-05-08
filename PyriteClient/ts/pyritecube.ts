class PyriteCube {
    X;
    Y;
    Z;
    Obj: THREE.Object3D; // the mesh of the cube
    TextureKey: string;
    Bbox: THREE.BoundingBox;
    DetailLevel: PyriteDetailLevel;

    constructor(dl: PyriteDetailLevel) {
        this.DetailLevel = dl;

    }

    isRendered(render: boolean, scene: THREE.Scene) {
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
    }

    // loads the mesh and textures and adds them to the scene
    load(scene : THREE.Scene) {
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
        objLoader.load(geometryUrl + "?fmt=obj", (o) => {
            this.Obj = o;
            this.Obj.name = this.X + "_" + this.Y + "_" + this.Z;
            o.traverse((child) => {
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
                    }, function (error) { console.log(error); });
                }
            });
            that.DetailLevel.Octree.add(o, null);
            scene.add(o);
            //that.pyrite.render();
            console.log("loaded obj: " + geometryUrl);
        });
    }
} 