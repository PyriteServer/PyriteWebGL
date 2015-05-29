var PyriteCube = (function () {
    //private boundingBoxHelper: THREE.BoundingBoxHelper;
    function PyriteCube(dl) {
        this.IsVisible = true;
        this.IsLoaded = false;
        this.UseEbo = false;
        this.Debug = false;
        this.upgraded = false;
        this.upgrading = false;
        this.DetailLevel = dl;
        this.PlaceholderMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.35 }); //red
        this.PlaceholderLoadedMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.35 }); //green
    }
    PyriteCube.prototype.destroy = function () {
        if (this.Mesh) {
            this.Scene.remove(this.Mesh);
            this.Scene.remove(this.PlaceholderMesh);
            this.Scene.remove(this.Bbox);
            this.Scene = null;
            this.Mesh = null;
            this.DetailLevel = null;
        }
    };
    //isLoaded(): boolean {
    //    //return this.Meshes.length > 0;
    //    //return !(typeof this.Mesh === 'undefined');
    //    return !(typeof this.Mesh === 'undefined');
    //}
    PyriteCube.prototype.update = function (camera) {
        if (this.IsLoaded) {
            if (this.upgradable() && this.shouldUpgrade(camera.position)) {
            }
            else if (this.downgradable() && this.shouldDowngrade(camera.position)) {
            }
        }
    };
    PyriteCube.prototype.upgradable = function () {
        return !this.upgraded && !this.upgrading;
    };
    PyriteCube.prototype.downgradable = function () {
        return this.upgraded && !this.upgrading;
    };
    PyriteCube.prototype.shouldUpgrade = function (cameraPos) {
        if (this.Mesh) {
            return this.Mesh.position.distanceTo(cameraPos) < this.DetailLevel.UpgradeDistance;
        }
        else
            return false;
    };
    PyriteCube.prototype.shouldDowngrade = function (cameraPos) {
        if (this.Mesh) {
            return this.Mesh.position.distanceTo(cameraPos) > this.DetailLevel.DowngradeDistance;
        }
        else
            return false;
    };
    PyriteCube.prototype.shouldLoad = function (cameraPos) {
        if (this.Mesh) {
            return this.Mesh.position.distanceTo(cameraPos) < this.DetailLevel.UpgradeDistance;
        }
        else
            return false;
    };
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
    PyriteCube.prototype.showMesh = function (show) {
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
    };
    PyriteCube.prototype.init = function (onInit) {
        this.meshName = this.X + "_" + this.Y + "_" + this.Z;
        //this.WorldCoords = this.DetailLevel.GetWorldCoordinatesForCube(this);
        this.geometryBufferAltitudeTransform = 0 - this.DetailLevel.ModelBoundsMin.z;
        var worldScale = new THREE.Vector3().copy(this.DetailLevel.WorldCubeScale);
    };
    // loads the mesh and textures and adds them to the scene
    PyriteCube.prototype.load = function (scene, octree) {
        if (this.IsLoaded)
            return;
        this.Scene = scene;
        this.meshName = this.X + "_" + this.Y + "_" + this.Z;
        //this.WorldCoords = this.DetailLevel.GetWorldCoordinatesForCube(this);
        this.geometryBufferAltitudeTransform = 0 - this.DetailLevel.ModelBoundsMin.z;
        var worldScale = new THREE.Vector3().copy(this.DetailLevel.WorldCubeScale);
        if (!this.IsVisible) {
            this.PlaceholderMesh = new THREE.Mesh(new THREE.BoxGeometry(worldScale.x, worldScale.y, worldScale.z), this.PlaceholderMaterial);
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
        }
        else {
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
                    loader.load(geometryUrl + "?fmt=ebo", function (mesh) {
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
                }
                else {
                    var objLoader = new THREE.OBJLoader();
                    objLoader.crossOrigin = 'anonymous';
                    objLoader.load(geometryUrl + "?fmt=obj", function (o) {
                        o.traverse(function (child) {
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
    };
    PyriteCube.prototype.addBoundingBox = function (mesh, value, that, scene) {
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
    };
    PyriteCube.prototype.gettexture = function (textureUrl, that, mesh) {
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
        }, function (error) {
            console.log(error);
        });
    };
    return PyriteCube;
})();
//# sourceMappingURL=pyritecube.js.map