var CubeContainer = (function () {
    function CubeContainer(detailLevel) {
        this.useEbo = false;
        this.isLoaded = false;
        this.isLoading = false;
        this.initialized = false;
        this.debug = false;
        this.upgraded = false;
        this.upgrading = false;
        this.textureQueue = new Array();
        this.detailLevel = detailLevel;
    }
    CubeContainer.prototype.init = function (scene, octree, showPlaceHolder) {
        this.scene = scene;
        if (octree)
            this.octree = octree;
        this.meshName = this.cube.x + "_" + this.cube.y + "_" + this.cube.z;
        this.addPlaceholder(showPlaceHolder);
        this.initialized = true;
    };
    CubeContainer.prototype.addPlaceholder = function (show) {
        var worldScale = new THREE.Vector3().copy(this.detailLevel.WorldCubeScale);
        this.placeholderMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.35 }); //red
        this.placeholderMesh = new THREE.Mesh(new THREE.BoxGeometry(worldScale.x, worldScale.y, worldScale.z), this.placeholderMaterial);
        this.placeholderMesh.name = "ph_" + this.meshName;
        this.placeholderMesh.translateX(this.cube.worldCoords.x);
        this.placeholderMesh.translateY(this.cube.worldCoords.y);
        this.placeholderMesh.translateZ(this.cube.worldCoords.z);
        this.placeholderMesh.geometry.computeBoundingBox();
        if (show) {
            this.scene.add(this.placeholderMesh);
        }
        var min = new THREE.Vector3(this.cube.x, this.cube.y, this.cube.z);
        var max = new THREE.Vector3(min.x + 1, min.y + 1, min.z + 1);
        this.bounds = new CubeBounds(this);
        this.bounds.boundingBox = new THREE.Box3(min, max);
        // add the placeholder mesh to the octree for more efficient searching
        this.octree.add(this);
    };
    // loads the cube mesh data from the server and the calls a web worker to construct the mesh
    CubeContainer.prototype.load = function (callback) {
        if (!this.initialized)
            throw "Cube container must be initialized before loading.";
        this.isLoading = true;
        
        var textureCoords = this.detailLevel.TextureCoordinatesForCube(this.cube.x, this.cube.y);
        var textureUrl = this.detailLevel.Query.GetTexturePath(this.detailLevel.Name, textureCoords.x, textureCoords.y);
        var geometryUrl = this.detailLevel.Query.GetModelPath(this.detailLevel.Name, this.cube.x, this.cube.y, this.cube.z);
        var that = this;
        if (this.useEbo) {
            //window.localStorage.clear();
            //var meshData = window.localStorage.getItem(that.meshName);
            //if (meshData) {
            //    var oloader = new THREE.JSONLoader();
            //    var item = JSON.stringify(meshData);
            //    var data = oloader.parse(item);
            //    //var textureKey = this.meshName + '_texture';
            //    this.gettexture(textureUrl, this.mesh, function () {
            //    });
            //}
            //else {
            var loader = new EBOLoader();
            loader.load(geometryUrl + "?fmt=ebo", function (mesh) {
                that.mesh = mesh;
                mesh.name = that.meshName;
                mesh.geometry.computeBoundingBox();
                that.gettexture(textureUrl, mesh, function () {
                    that.scene.remove(that.placeholderMesh);
                    that.scene.add(mesh);
                    that.isLoaded = true;
                    that.isLoading = false;
                    that.detailLevel.Query.addActiveCube(that);
                    if (that.debug) {
                        that.addBoundingBox(mesh, that);
                    }
                    //var meshJson = mesh.toJSON();
                    //window.localStorage.setItem(that.meshName, JSON.stringify(meshJson));
                    callback();
                });
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
                        that.mesh = child;
                        that.gettexture(textureUrl, child, function () {
                            that.scene.remove(that.placeholderMesh);
                            that.scene.add(child);
                            that.isLoaded = true;
                            that.isLoading = false;
                            that.detailLevel.Query.addActiveCube(that);
                            if (that.debug) {
                                that.addBoundingBox(child, that);
                            }
                            //window.localStorage.setItem(that.meshName, child.toJSON());
                            callback();
                        });
                    }
                });
            });
        }
    };
    CubeContainer.prototype.unload = function () {
        this.detailLevel.Query.activeCubes.splice(this.detailLevel.Query.activeCubes.indexOf(this), 1);
        if (this.debug)
            this.scene.remove(this.bbox);
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.mesh = null;
        this.isLoaded = false;
    };
    CubeContainer.prototype.gettexture = function (textureUrl, mesh, onLoad) {
        var that = this;
        //if (this.detailLevel.Query.loader.pyrite.cache.contains(textureUrl)) {
        //    var texture = this.getCachedTexture(textureUrl);
        //    // if the key is in the cache, but the texture is not saved, then there is another operation downloading it, so wait and try again.
        //    if (texture == null) {
        //        if(this.timeout !== undefined) clearTimeout(this.timeout);
        //        this.timeout = setTimeout(this.gettexture(textureUrl, mesh, onLoad), 3000);
        //        //return;
        //    }
        //    var material = new THREE.MeshBasicMaterial();
        //    material.map = texture;
        //    material.map.needsUpdate = true;
        //    material.needsUpdate = true;
        //    mesh.material = material;
        //    onLoad();
        //} else {
        //that.setCachedTexture(textureUrl, null);
        THREE.ImageUtils.crossOrigin = 'anonymous';
        THREE.ImageUtils.loadTexture(textureUrl, THREE.UVMapping, function (texture) {
            var material = new THREE.MeshBasicMaterial();
            material.map = texture;
            material.map.needsUpdate = true;
            material.needsUpdate = true;
            mesh.material = material;
            //that.setCachedTexture(textureUrl, texture);
            onLoad();
        }, function (error) {
            console.log(error);
        });
        //}
    };
    //getCachedTexture(texturKey): THREE.Texture {
    //    return this.detailLevel.Query.loader.pyrite.cache.get(texturKey);
    //}
    //setCachedTexture(textureKey, texture) {
    //    this.detailLevel.Query.loader.pyrite.cache.set(textureKey, texture);
    //}
    CubeContainer.prototype.addBoundingBox = function (mesh, that) {
        var value = that.detailLevel.Value;
        var scene = that.scene;
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
        that.bbox = new THREE.BoundingBoxHelper(mesh, hex);
        that.bbox.update();
        scene.add(that.bbox);
    };
    CubeContainer.prototype.upgradable = function () {
        return !this.upgraded && !this.upgrading;
    };
    CubeContainer.prototype.downgradable = function () {
        return this.upgraded && !this.upgrading;
    };
    CubeContainer.prototype.shouldUpgrade = function (cameraPos) {
        if (this.detailLevel.isHighestLod() || this.detailLevel.Value < Config.maxlod)
            return false;
        if (this.mesh) {
            var distance = this.cube.worldCoords.distanceTo(cameraPos);
            return distance < this.detailLevel.UpgradeDistance;
        }
        else
            return false;
    };
    CubeContainer.prototype.shouldDowngrade = function (cameraPos) {
        if (this.mesh) {
            var distance = this.cube.worldCoords.distanceTo(cameraPos);
            return distance > this.detailLevel.DowngradeDistance;
        }
        else
            return false;
    };
    return CubeContainer;
})();