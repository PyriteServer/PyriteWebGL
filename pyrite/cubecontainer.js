var CubeContainer = (function () {
    function CubeContainer(detailLevel) {
        this.useEbo = false;
        this.useCtm = false;
        this.isLoaded = false;
        this.isLoading = false;
        this.isUnloading = false;
        this.initialized = false;
        this.debug = false;
        this.upgraded = false;
        this.upgrading = false;
        this.textureQueue = new MicroCache();
        this.detailLevel = detailLevel;
        this.mesh;
        this.toggleYZ = new THREE.Matrix4();
    }
    CubeContainer.prototype.init = function (scene, octree, showPlaceHolder) {
        this.scene = scene;
        if (octree)
            this.octree = octree;
        this.meshName = this.cube.x + "_" + this.cube.y + "_" + this.cube.z;
        this.addPlaceholder(showPlaceHolder);
        this.toggleYZ.set(
            1,0,0,0,
            0,0,1,0,
            0,-1,0,0,
            0,0,0,1
        );
        this.initialized = true;
    };
    CubeContainer.prototype.addPlaceholder = function (show) {
        var worldScale = new THREE.Vector3().copy(this.detailLevel.WorldCubeScale);
        this.placeholderMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.35 }); //red
        this.placeholderMesh = new THREE.Mesh(new THREE.BoxGeometry(worldScale.x, worldScale.y, worldScale.z), this.placeholderMaterial);
        this.placeholderMesh.name = "ph_" + this.meshName;
        // this.placeholderMesh.translateX(this.cube.worldCoords.x);
        // this.placeholderMesh.translateY(this.cube.worldCoords.y);
        // this.placeholderMesh.translateZ(this.cube.worldCoords.z);
        ///this.placeholderMesh.position.set(this.cube.worldCoords.x, this.cube.worldCoords.y, this.cube.worldCoords.z);
        this.placeholderMesh.position.set(this.cube.worldCoords.x, this.cube.worldCoords.z, -this.cube.worldCoords.y);
        //this.placeholderMesh.applyMatrix(this.toggleYZ);
        //this.placeholderMesh.geometry.applyMatrix(this.toggleYZ);
        this.placeholderMesh.geometry.computeBoundingBox();
        this.placeholderMesh.geometry.computeBoundingSphere();
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
        var _this = this;
        if (this.useCtm) {         
            var loader = new THREE.CTMLoader(true);
            loader.load(geometryUrl + "?fmt=ctm&webgl=1",function (geometry) {
                var material1 = new THREE.MeshLambertMaterial( { color: 0xf0ffff } );
                var mesh = new THREE.Mesh(geometry, material1);
                _this.mesh = mesh;
                mesh.name = _this.meshName;
                _this.gettexture(textureUrl, mesh, function () {
                    mesh.geometry.applyMatrix(_this.toggleYZ);
                    _this.scene.remove(_this.placeholderMesh);
                    _this.scene.add(mesh);
                    _this.isLoaded = true;
                    _this.isLoading = false;
                    if (_this.debug) {
                        _this.addBoundingBox(mesh, _this);
                    }
                    callback();
                });
            }); //, {useWorker: false, worker: new Worker("js/ctm/CTMWorker.js")} );
        } else if (this.useEbo) {
            var loader = new EBOLoader();
            loader.load(geometryUrl + "?fmt=ebo", function (mesh) {
                _this.mesh = mesh;
                mesh.name = _this.meshName;
                
                mesh.geometry.computeBoundingBox();
                _this.gettexture(textureUrl, mesh, function () {
                    mesh.geometry.applyMatrix(_this.toggleYZ);
                    _this.scene.remove(_this.placeholderMesh);
                    _this.scene.add(mesh);
                    _this.isLoaded = true;
                    _this.isLoading = false;
                    if (_this.debug) {
                        _this.addBoundingBox(mesh, _this);
                    }
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
                        child.name = _this.meshName;
                        _this.mesh = child;
                        _this.gettexture(textureUrl, child, function () {
                            child.geometry.applyMatrix(_this.toggleYZ);
                            _this.scene.remove(_this.placeholderMesh);
                            _this.scene.add(child);
                            _this.isLoaded = true;
                            _this.isLoading = false;
                            if (_this.debug) {
                                _this.addBoundingBox(child, _this);
                            }
                            callback();
                        });
                    }
                });
            });
        }
    };
    CubeContainer.prototype.unload = function () {
        this.isUnloading = true;
        if (this.debug)
            this.scene.remove(this.bbox);
            
        if(this.mesh){
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.mesh = null;
        }

        this.isLoaded = false;
        this.isUnloading = false;
    };
    CubeContainer.prototype.gettexture = function (textureUrl, mesh, onLoad) {
        var texture = this.detailLevel.Query.loader.cache.getSet(textureUrl, function(){
            THREE.ImageUtils.crossOrigin = 'anonymous';
            return THREE.ImageUtils.loadTexture(textureUrl);
        });
        if(!texture.img || typeof texture.img === 'undefined'){
            console.log('texture image not loaded');
            // var waitList = this.textureQueue.getSet(textureUrl, function(){
            //    return new Array(); 
            // });
            // waitList.push(mesh);
            //return;
        }
        var material = new THREE.MeshBasicMaterial();
        material.map = texture;
        material.map.needsUpdate = true;
        material.needsUpdate = true;
        mesh.material = material;
        onLoad();
    };
    CubeContainer.prototype.addBoundingBox = function (mesh, that) {
        var value = that.detailLevel.Value;
        var scene = that.scene;
        var hex = 0xff0000;
        switch (value) {
            case 0:
                hex = 0xffffff;
            break;
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
            default:
                hex = 0xffffff;
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