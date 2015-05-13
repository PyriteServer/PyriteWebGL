class PyriteCube {
    X;
    Y;
    Z;
    WorldCoords: THREE.Vector3;
    CorrectedWorldCoords: THREE.Vector3;
    Obj: THREE.Object3D; // the mesh of the cube
    Meshes: Array<THREE.Mesh>;
    PlaceholderObject: THREE.Object3D;
    PlaceholderMesh: THREE.Mesh; // this mesh is for the initial Octree load
    PlaceholderLoadedMaterial: THREE.Material;
    PlaceholderMaterial: THREE.Material;
    TextureKey: string;
    Bbox: THREE.BoundingBoxHelper;
    DetailLevel: PyriteDetailLevel;
    IsVisible: boolean = false;
    meshName: string;
    geometryBufferAltitudeTransform

    //private boundingBoxHelper: THREE.BoundingBoxHelper;

    constructor(dl: PyriteDetailLevel) {
        this.DetailLevel = dl;
        this.PlaceholderMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.35 }); //red
        this.PlaceholderLoadedMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.35 }); //green
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

    showMesh(show: boolean) {
        if (show) {
            if (this.IsVisible) {
                if (this.Meshes && this.Meshes.length > 0) {
                    for (var i = 0; i < this.Meshes.length; i++) {
                        this.Meshes[i].visible = true;
                    }
                }
                if (this.PlaceholderMesh) {
                    this.PlaceholderMesh.visible = false;
                }
            }
            else {
                if (this.Meshes && this.Meshes.length > 0) {
                    for (var i = 0; i < this.Meshes.length; i++) {
                        this.Meshes[i].visible = false;
                    }
                }
                if (this.PlaceholderMesh) {
                    this.PlaceholderMesh.visible = true;
                }
            }
        }
        else {
            if (this.Meshes && this.Meshes.length > 0) {
                for (var i = 0; i < this.Meshes.length; i++) {
                    this.Meshes[i].visible = false;
                }
            }
            if (this.PlaceholderMesh) {
                this.PlaceholderMesh.visible = false;
            }
        }

    }

    // loads the mesh and textures and adds them to the scene
    load(scene: THREE.Scene, octree: THREE.Octree) {
        this.meshName = this.X + "_" + this.Y + "_" + this.Z;
        this.WorldCoords = this.DetailLevel.GetWorldCoordinatesForCube(this);
        this.geometryBufferAltitudeTransform = 0 - this.DetailLevel.ModelBoundsMin.z;     
        var worldScale = new THREE.Vector3().copy(this.DetailLevel.WorldCubeScale);

        if (!this.IsVisible) {
            this.PlaceholderMesh = new THREE.Mesh(new THREE.BoxGeometry(worldScale.x,
                worldScale.y,
                worldScale.z), this.PlaceholderMaterial);
            this.PlaceholderMesh.name = "ph_" + this.meshName;
            this.PlaceholderMesh.translateX(this.WorldCoords.x);
            this.PlaceholderMesh.translateY(this.WorldCoords.y);
            this.PlaceholderMesh.translateZ(this.WorldCoords.z);
            this.PlaceholderMesh.geometry.boundingSphere = new THREE.Sphere(this.WorldCoords, worldScale.x / 2);
            scene.add(this.PlaceholderMesh);
            octree.add(this.PlaceholderMesh, { useFaces: false, useVertices: true});
            //octree.update();
        } else {
             // remove the placeholder mesh from the octree query - it will use the normal mesh from here on out
            if (this.PlaceholderMesh) {
                octree.remove(this.PlaceholderMesh);
                this.PlaceholderMesh.visible = false;
                this.PlaceholderMesh.material = this.PlaceholderLoadedMaterial;
                
            }

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

            //var loader = new EBOLoader();
            //loader.load(geometryUrl, (g) => {
            //    console.log(g.name);
            //});

            var objLoader = new THREE.OBJLoader();
            objLoader.load(geometryUrl + "?fmt=obj", (o) => {
                if (!this.Meshes)
                    this.Meshes = new Array(o.children.length);
                var index = 0;

                o.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        
                        child.name = that.meshName;
                        that.Meshes[index] = child;
                        index++;
                        octree.add(child, { useFaces: false, useVertices: false});
                        //octree.update();

                        scene.add(child);

                        THREE.ImageUtils.crossOrigin = 'anonymous';
                        THREE.ImageUtils.loadTexture(textureUrl, THREE.UVMapping, function (texture) {
                            console.log("begin loadTexture callback");
                            console.log("cube - " + that.meshName);
                            console.log("cube texture key - " + that.TextureKey);
                            console.log("texture url - " + texture.image.src);

                            var material = new THREE.MeshBasicMaterial();
                            material.map = texture;
                            material.map.needsUpdate = true;
                            material.needsUpdate = true;
                            child.material = material;

                        }, function (error) { console.log(error); });
                    }
                });
                
                scene.add(o);
                //that.Bbox = new THREE.BoundingBoxHelper(o, 0x00ff00);
                //that.Bbox.update();
                //scene.add(that.Bbox);
                that.Obj = o;
                that.Obj.name = that.meshName;

                console.log("loaded obj: " + geometryUrl);
            });
        }
    }
} 