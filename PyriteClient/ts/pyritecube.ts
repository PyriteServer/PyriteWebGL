class PyriteCube {
    X;
    Y;
    Z;
    WorldCoords: THREE.Vector3;
    CorrectedWorldCoords: THREE.Vector3;
    Obj: THREE.Object3D; // the mesh of the cube
    //Meshes: Array<THREE.Mesh>;
    Mesh: THREE.Mesh;
    PlaceholderObject: THREE.Object3D;
    PlaceholderMesh: THREE.Mesh; // this mesh is for the initial Octree load
    PlaceholderLoadedMaterial: THREE.Material;
    PlaceholderMaterial: THREE.Material;
    DebugMaterial: THREE.Material;
    TextureKey: string;
    Bbox: THREE.BoundingBoxHelper;
    BoundingBox: THREE.Box3; // the bounding box for the octree system
    DetailLevel: PyriteDetailLevel;
    IsVisible: boolean = true;
    meshName: string;
    IsLoaded: boolean = false;
    Scene: THREE.Scene;
    UseEbo: boolean = false;
    Debug: boolean = false;

    private
    upgraded: boolean = false;
    upgrading: boolean = false;
    geometryBufferAltitudeTransform

    //private boundingBoxHelper: THREE.BoundingBoxHelper;

    constructor(dl: PyriteDetailLevel) {
        this.DetailLevel = dl;
        this.PlaceholderMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.35 }); //red
        this.PlaceholderLoadedMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.35 }); //green
    }

    destroy() {
        if (this.Mesh) {
            this.Scene.remove(this.Mesh);
            this.Scene.remove(this.PlaceholderMesh);
            this.Scene.remove(this.Bbox);

            this.Scene = null;
            this.Mesh = null;
            this.DetailLevel = null;
        }
    }

    //isLoaded(): boolean {
    //    //return this.Meshes.length > 0;
    //    //return !(typeof this.Mesh === 'undefined');
    //    return !(typeof this.Mesh === 'undefined');
    //}

    update(camera: THREE.Camera) {
        if (this.IsLoaded) {
            if (this.upgradable() && this.shouldUpgrade(camera.position)) {

            } else if (this.downgradable() && this.shouldDowngrade(camera.position)) {

            }
        }
    }

    upgradable() {
        return !this.upgraded && !this.upgrading;
    }

    downgradable() {
        return this.upgraded && !this.upgrading;
    }

    shouldUpgrade(cameraPos: THREE.Vector3) {
        if (this.Mesh) {
            return this.Mesh.position.distanceTo(cameraPos) < this.DetailLevel.UpgradeDistance;
        }
        else
            return false;
    }

    shouldDowngrade(cameraPos: THREE.Vector3) {
        if (this.Mesh) {
            return this.Mesh.position.distanceTo(cameraPos) > this.DetailLevel.DowngradeDistance;
        } else
            return false;
    }

    shouldLoad(cameraPos: THREE.Vector3) {
        if (this.Mesh) {
            return this.Mesh.position.distanceTo(cameraPos) < this.DetailLevel.UpgradeDistance;
        }
        else
            return false;
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

    //checkUpgrade(cameraPos: THREE.Vector3) {
    //    var scope = this;

    //    // if meshes is null, then they need to be loaded

    //    if (!this.Meshes) {
    //        //this.load(
    //    }
    //    else {
    //        this.Meshes.forEach((mesh) => {
    //            if (mesh.position.distanceTo(cameraPos) <= 125) {

    //            }
    //        });
    //    }
    //}

    showMesh(show: boolean) {
        if (show) {
            if (this.IsVisible) {
                //if (this.Meshes && this.Meshes.length > 0) {
                //    for (var i = 0; i < this.Meshes.length; i++) {
                //        this.Meshes[i].visible = true;
                //    }
                //}
                if (this.PlaceholderMesh) {
                    this.PlaceholderMesh.visible = false;
                }
            }
            else {
                //if (this.Meshes && this.Meshes.length > 0) {
                //    for (var i = 0; i < this.Meshes.length; i++) {
                //        this.Meshes[i].visible = false;
                //    }
                //}
                if (this.PlaceholderMesh) {
                    this.PlaceholderMesh.visible = true;


                }
            }
        }
        else {
            //if (this.Meshes && this.Meshes.length > 0) {
            //    for (var i = 0; i < this.Meshes.length; i++) {
            //        this.Meshes[i].visible = false;
            //    }
            //}
            if (this.PlaceholderMesh) {
                this.PlaceholderMesh.visible = false;
            }
        }

    }

    init(onInit) {
        this.meshName = this.X + "_" + this.Y + "_" + this.Z;
        //this.WorldCoords = this.DetailLevel.GetWorldCoordinatesForCube(this);
        this.geometryBufferAltitudeTransform = 0 - this.DetailLevel.ModelBoundsMin.z;
        var worldScale = new THREE.Vector3().copy(this.DetailLevel.WorldCubeScale);
    }

    // loads the mesh and textures and adds them to the scene
    load(scene: THREE.Scene, octree: Octree) {
        if (this.IsLoaded) return;
        this.Scene = scene;
        this.meshName = this.X + "_" + this.Y + "_" + this.Z;
        //this.WorldCoords = this.DetailLevel.GetWorldCoordinatesForCube(this);
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
            this.PlaceholderMesh.geometry.computeBoundingBox();
            //this.PlaceholderMesh.visible = false;
            //this.BoundingBox = new THREE.Box3(this.PlaceholderMesh.s
            scene.add(this.PlaceholderMesh);
            this.IsLoaded = true;
            //octree.add(this.PlaceholderMesh, { useFaces: false, useVertices: true });
            //octree.update();
        } else {
            if (this.Debug) {

                if (!this.DebugMaterial) {
                    this.DebugMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.35 }); //blue
                }

                if (this.PlaceholderMesh) {
                    //octree.remove(this.PlaceholderMesh);
                    //this.PlaceholderMesh.visible = false;
                    this.PlaceholderMesh.material = this.DebugMaterial;
                }
            }
            else {
                // remove the placeholder mesh from the octree query - it will use the normal mesh from here on out
                if (this.PlaceholderMesh) {
                    //octree.remove(this.PlaceholderMesh);
                    this.PlaceholderMesh.visible = false;
                    this.PlaceholderMesh.material = this.PlaceholderLoadedMaterial;

                }

                var textureCoords = this.DetailLevel.TextureCoordinatesForCube(this.X, this.Y);
                var textureUrl = this.DetailLevel.Query.GetTexturePath(this.DetailLevel.Name, textureCoords.x, textureCoords.y);
                this.TextureKey = textureUrl;
                var geometryUrl = this.DetailLevel.Query.GetModelPath(this.DetailLevel.Name, this.X, this.Y, this.Z);
                var that = this;

                //if (!this.Meshes)
                //    this.Meshes = new Array();

                if (this.UseEbo) {
                    //var worker = new Worker("");
                    //worker.
                    var loader = new EBOLoader();
                    loader.load(geometryUrl + "?fmt=ebo", (mesh: THREE.Mesh) => {
                        //that.Meshes.push(mesh);
                        that.Mesh = mesh;
                        mesh.name = that.meshName;
                        mesh.geometry.computeBoundingBox();
                        //octree.add(mesh, { useFaces: false, useVertices: false });
                        //octree.update();
                        scene.add(mesh);
                        that.IsLoaded = true;
                        that.gettexture(textureUrl, that, mesh);
                        that.addBoundingBox(mesh, that.DetailLevel.Value, that, scene);
                    });

                } else {
                    var objLoader = new THREE.OBJLoader();
                    objLoader.crossOrigin = 'anonymous';
                    objLoader.load(geometryUrl + "?fmt=obj", (o) => {
                        o.traverse((child) => {
                            if (child instanceof THREE.Mesh) {
                                child.geometry.computeVertexNormals();
                                child.name = that.meshName;
                                that.Mesh = child;
                                //that.Meshes.push(child);
                                //octree.add(child, { useFaces: false, useVertices: false });
                                scene.add(child);
                                that.IsLoaded = true;
                                that.gettexture(textureUrl, that, child);

                                that.addBoundingBox(child, that.DetailLevel.Value, that, scene);
                            }
                        });

                        //scene.add(o);

                        that.Obj = o;
                        that.Obj.name = that.meshName;

                        console.log("loaded obj: " + geometryUrl);
                    });
                }
            }
        }
    }

    addBoundingBox(mesh: THREE.Mesh, value, that, scene) {
        var hex = 0xff0000;
        switch (value) {
            case 1:
                hex = 0xff0000;
                break;
            case 2:
                hex = 0xff8000;
                break;
            case 3:
                hex = 0xffff00;
                break;
            case 4:
                hex = 0x00ff00;
                break;
        }

        that.Bbox = new THREE.BoundingBoxHelper(that.Mesh, hex);
        that.Bbox.update();
        scene.add(that.Bbox);
    }

    gettexture(textureUrl, that, mesh: THREE.Mesh) {
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
            mesh.material = material;

        }, function (error) { console.log(error); });
    }
} 