class CubeContainer {
    cube: Cube; // the DTO that represents the cube
    detailLevel: PyriteDetailLevel;
    useEbo: boolean = false;
    isLoaded: boolean = false;
    isLoading: boolean = false;
    scene: THREE.Scene;
    bbox: THREE.BoundingBoxHelper;
    mesh: THREE.Mesh;
    meshName: string;
    placeholderMesh: THREE.Mesh; // this mesh is for the initial Octree load
    placeholderLoadedMaterial: THREE.Material;
    placeholderMaterial: THREE.Material;
    initialized: boolean = false;
    debug: boolean = false;

    private
    upgraded: boolean = false;
    upgrading: boolean = false;

    constructor(detailLevel: PyriteDetailLevel) {
        this.detailLevel = detailLevel;
    }

    init(scene: THREE.Scene, octree?: Octree) {
        this.scene = scene;
        this.meshName = this.cube.x + "_" + this.cube.y + "_" + this.cube.z;

        this.buildPlaceholder();

        this.initialized = true;
    }

    buildPlaceholder() {
        var worldScale = new THREE.Vector3().copy(this.detailLevel.WorldCubeScale);
        this.placeholderMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.35 }); //red
        this.placeholderMesh = new THREE.Mesh(new THREE.BoxGeometry(worldScale.x, worldScale.y, worldScale.z), this.placeholderMaterial);
        this.placeholderMesh.name = "ph_" + this.meshName;
        this.placeholderMesh.translateX(this.cube.worldCoords.x);
        this.placeholderMesh.translateY(this.cube.worldCoords.y);
        this.placeholderMesh.translateZ(this.cube.worldCoords.z);
        this.placeholderMesh.geometry.computeBoundingBox();
        this.scene.add(this.placeholderMesh);
    }

    // loads the cube mesh data from the server and the calls a web worker to construct the mesh
    load() {
        if (!this.initialized) throw "Cube container must be initialized before loading.";
        this.isLoading = true;

        var textureCoords = this.detailLevel.TextureCoordinatesForCube(this.cube.x, this.cube.y);
        var textureUrl = this.detailLevel.Query.GetTexturePath(this.detailLevel.Name, textureCoords.x, textureCoords.y);
        var geometryUrl = this.detailLevel.Query.GetModelPath(this.detailLevel.Name, this.cube.x, this.cube.y, this.cube.z);
        var that = this;

        //var worker = new Worker("ts/cubeworker.js");
        //worker.onmessage = function (e) {
        //    var mesh = e.data;
        //    that.mesh = mesh;
        //    mesh.name = that.meshName;
        //    mesh.geometry.computeBoundingBox();
        //    that.scene.add(mesh);
        //    //that.gettexture(textureUrl, that, mesh);
        //};

        //worker.postMessage([geometryUrl, textureUrl]);
        if (this.useEbo) {
            var loader = new EBOLoader();
            loader.load(geometryUrl + "?fmt=ebo", (mesh: THREE.Mesh) => {
                that.mesh = mesh;
                mesh.name = that.meshName;
                mesh.geometry.computeBoundingBox();
                //octree.add(mesh, { useFaces: false, useVertices: false });
                //octree.update();

                that.gettexture(textureUrl, mesh, () => {
                    that.scene.remove(that.placeholderMesh);
                    that.scene.add(mesh);
                    that.isLoaded = true;
                    that.isLoading = false;

                    if (that.debug) {
                        that.addBoundingBox(mesh, that);
                    }
                });
            });
        }
        else {
            var objLoader = new THREE.OBJLoader();
            objLoader.crossOrigin = 'anonymous';
            objLoader.load(geometryUrl + "?fmt=obj", (o) => {
                o.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.geometry.computeVertexNormals();
                        child.name = that.meshName;
                        that.mesh = child;
                        //that.Meshes.push(child);
                        //octree.add(child, { useFaces: false, useVertices: false });
                        that.gettexture(textureUrl, child, () => {
                            that.scene.remove(that.placeholderMesh);
                            that.scene.add(child);
                            that.isLoaded = true;
                            that.isLoading = false;

                            if (that.debug) {
                                that.addBoundingBox(child, that);
                            }
                        });
                    }
                });
            });
        }
    }

    gettexture(textureUrl, mesh: THREE.Mesh, onLoad) {
        THREE.ImageUtils.crossOrigin = 'anonymous';
        THREE.ImageUtils.loadTexture(textureUrl, THREE.UVMapping, function (texture) {
            var material = new THREE.MeshBasicMaterial();
            material.map = texture;
            material.map.needsUpdate = true;
            material.needsUpdate = true;
            mesh.material = material;
            onLoad();
        }, function (error) { console.log(error); });
    }

    addBoundingBox(mesh: THREE.Mesh, that) {
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
    }

    upgradable() {
        return !this.upgraded && !this.upgrading;
    }

    downgradable() {
        return this.upgraded && !this.upgrading;
    }

    shouldUpgrade(cameraPos: THREE.Vector3) {
        if (this.detailLevel.isHighestLod() || this.detailLevel.Value < Config.maxlod) return false;

        if (this.mesh) {
            return this.mesh.position.distanceTo(cameraPos) < this.detailLevel.UpgradeDistance;
        }
        else
            return false;
    }

    shouldDowngrade(cameraPos: THREE.Vector3) {
        if (this.mesh) {
            return this.mesh.position.distanceTo(cameraPos) > this.detailLevel.DowngradeDistance;
        } else
            return false;
    }
} 