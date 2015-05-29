var PyriteDetailLevel = (function () {
    function PyriteDetailLevel(scene) {
        this.Cubes = new Array();
        this.VisibleCubes = new Array(0);
        //Octree: THREE.Octree;
        this.Octree = new Octree();
        this.UseOctree = false;
        this.meshes = [];
        this.meshesSearch = [];
        this.meshCountMax = 1000;
        this.radius = 500;
        this.radiusMax = this.radius * 10;
        this.radiusMaxHalf = this.radiusMax * 0.5;
        this.radiusSearch = 125; // i'm saying this is equivalent to the distance from the camera
        this.baseR = 255;
        this.baseG = 0;
        this.baseB = 255;
        this.foundR = 0;
        this.foundG = 255;
        this.foundB = 0;
        this.adding = true;
        this.rayCaster = new THREE.Raycaster();
        this.origin = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.cubesToShow = new Array(0);
        this.cubesToHide = new Array(0);
        this.threadPool = new ThreadPool();
        //loadThread = function (param, done) {
        //    param.load(this.scene, this.Octree)
        //}
        this.searchOctree = function searchOctree(camera) {
            // record start time
            //var timeStart = Date.now();
            // search octree from search mesh position with search radius
            // optional third parameter: boolean, if should sort results by object when using faces in octree
            // optional fourth parameter: vector3, direction of search when using ray (assumes radius is distance/far of ray)
            //this.origin.copy(this.searchMesh.position);
            this.origin.copy(camera.position);
            //this.meshesSearch = this.Octree.search(this.origin, this.radiusSearch, true);
            this.direction = new THREE.Vector3(0, 0, -1);
            this.direction.add(camera.position);
            this.direction.applyQuaternion(camera.quaternion);
            this.rayCaster.set(this.origin, this.direction);
            this.meshesSearch = this.Octree.search(this.rayCaster.ray.origin, this.radiusSearch, true, this.rayCaster.ray.direction);
            //this.meshesSearch = this.Octree.search(this.rayCaster.ray.origin, this.radiusSearch, true);
            var intersections = this.rayCaster.intersectOctreeObjects(this.meshesSearch, true);
            // record end time
            //var timeEnd = Date.now();
            /*
            
            // results to console
            
            console.log( 'OCTREE: ', octree );
            console.log( '... searched ', meshes.length, ' and found ', meshesSearch.length, ' with intersections ', intersections.length, ' and took ', ( timeEnd - timeStart ), ' ms ' );
            
            */
        };
        this.scene = scene;
        //this.Octree = new THREE.Octree({
        //    undeferred: false,
        //    depthMax: Infinity,
        //    objectsThreshold: 8,
        //    overlapPct: 0.15,
        //    //scene: this.scene
        //});
    }
    PyriteDetailLevel.prototype.isHighestLod = function () {
        return this == this.Query.DetailLevels[0];
    };
    PyriteDetailLevel.prototype.isLowestLod = function () {
        var largestIndex = this.Query.DetailLevels.length - 1;
        return this == this.Query.DetailLevels[largestIndex];
    };
    PyriteDetailLevel.prototype.update = function (camera) {
        //this.Cubes.forEach((c) => {
        //    if (c.upgradable() && c.shouldUpgrade(camera.position)) {
        //        if (!c.isLoaded) {
        //            c.load();
        //        }
        //        else {
        //            this.Query.upgradeCubeLod(c);
        //        }
        //    } else if (c.downgradable() && c.shouldDowngrade(camera.position)) {
        //    }
        //});
        //if (!this.arrowHelper) {
        //    //camera.
        //}
        //if (!this.lastCameraPos) {
        //    this.lastCameraPos = new THREE.Vector3();
        //    if (this.UseOctree) {
        //        this.searchOctree(camera); // this searches the octree an initial time
        //    }
        //    else {
        //        this.Cubes.forEach((c) => {
        //            c.update(camera);
        //        });
        //    }
        //}
        //if (this.lastCameraPos.distanceTo(camera.position) > 10) {
        //    if (this.UseOctree) {
        //        this.searchOctree(camera);
        //    }
        //    else {
        //        this.Cubes.forEach((c) => {
        //            c.update(camera);
        //        });
        //    }
        //    this.lastCameraPos.set(camera.position.x, camera.position.y, camera.position.z);
        //}
        //if (this.UseOctree) {
        //    if (this.meshesSearch.length != this.lastSearchCount) {
        //        this.lastSearchCount = this.meshesSearch.length;
        //        this.processSearch();
        //    }
        //    this.Octree.update();
        //}
        //this.searchOctree(camera);
    };
    PyriteDetailLevel.prototype.processSearch = function () {
        var i, il;
        var that = this;
        for (var c = 0; c < that.Cubes.length; c++) {
            var cube = that.Cubes[c];
            var meshName;
            var found = false;
            for (i = 0, il = this.meshesSearch.length; i < il; i++) {
                meshName = that.meshesSearch[i].object.name;
                if (meshName.indexOf("ph") != -1) {
                    meshName = meshName.substring(3);
                }
                if (cube.meshName == meshName) {
                    found = true;
                    break;
                }
            }
        }
        // clear the visible cubes list
        if (this.VisibleCubes && this.VisibleCubes.length > 0) {
        }
        for (var c = 0; c < that.cubesToShow.length; c++) {
        }
        for (var c = 0; c < that.cubesToHide.length; c++) {
        }
    };
    PyriteDetailLevel.prototype.load = function () {
        var _this = this;
        var maxboundingboxquery = this.WorldBoundsMin.x + "," + this.WorldBoundsMin.y + "," + this.WorldBoundsMin.z + "/" + this.WorldBoundsMax.x + "," + this.WorldBoundsMax.y + "," + this.WorldBoundsMax.z;
        var cubesUrl = this.Query.versionUrl + "query/" + this.Name + "/" + maxboundingboxquery;
        var that = this;
        $.get(cubesUrl).done(function (r) {
            var cubes = r.result;
            for (var i = 0; i < that.Cubes.length; i++) {
                var cube = new PyriteCube(that);
                cube.X = cubes[i][0];
                cube.Y = cubes[i][1];
                cube.Z = cubes[i][2];
                //that.Cubes[i] = cube;
                var min = new THREE.Vector3(cube.X, cube.Y, cube.Z);
                var max = min.add(new THREE.Vector3(1, 1, 1));
                //cube.BoundingBox = new THREE.Box3(min, max);
                _this.Octree.add(cube.Mesh);
            }
            //onLoad(dl);
            //this.loader.onLoaded(dl);
        });
    };
    PyriteDetailLevel.prototype.addCube = function (cube) {
        if (this.cubeExists(cube.x, cube.y, cube.z)) {
            return;
        }
        this.Cubes.push(cube);
        this.Octree.add(cube);
    };
    PyriteDetailLevel.prototype.cubeExists = function (x, y, z) {
        return this.Cubes.some(function (value, index, values) {
            return value.cube.x == x && value.cube.y == y && value.cube.z == z;
        });
    };
    PyriteDetailLevel.prototype.showCube = function (show, x, y, z) {
        for (var i = 0; i < this.Cubes.length; i++) {
            var cube = this.Cubes[i].cube;
            if (cube.x == x && cube.y == y && cube.z == z) {
            }
        }
    };
    PyriteDetailLevel.prototype.hideCube = function (x, y, z) {
        for (var i = 0; i < this.Cubes.length; i++) {
            var cube = this.Cubes[i].cube;
            if (cube.x == x && cube.y == y && cube.z == z) {
            }
        }
    };
    PyriteDetailLevel.prototype.hideAllCubes = function () {
        for (var i = 0; i < this.Cubes.length; i++) {
        }
    };
    PyriteDetailLevel.prototype.removeCube = function (x, y, z) {
        for (var i = 0; i < this.Cubes.length; i++) {
            var cube = this.Cubes[i].cube;
            if (cube.x == x && cube.y == y && cube.z == z) {
                this.Cubes.splice(i, 1);
            }
            //cube.destroy();
            cube = null;
        }
    };
    PyriteDetailLevel.prototype.loadCubes = function () {
        var _this = this;
        var initCount = 0;
        var cubes = this.Cubes;
        var that = this;
        cubes.forEach(function (c) {
            c.cube.worldCoords = _this.GetWorldCoordinatesForCube(c.cube);
            c.init(_this.scene);
            c.load();
            //that.threadPool.run(["ts/pyritecube.js"], function (param, done) {
            //    param.prototype = PyriteCube.prototype;
            //    param.load(this.scene, this.Octree)
            //}, [c]);
            //this.Octree.add(c, null);
            //c.init(function () {
            //    initCount++;
            //});
        });
    };
    PyriteDetailLevel.prototype.TextureCoordinatesForCube = function (cubeX, cubeY) {
        var textureXPosition = (cubeX / (this.SetSize.x / this.TextureSetSize.x));
        var textureYPosition = (cubeY / (this.SetSize.y / this.TextureSetSize.y));
        return new THREE.Vector2(Math.floor(textureXPosition), Math.floor(textureYPosition));
    };
    PyriteDetailLevel.prototype.GetWorldCoordinatesForCube = function (cube) {
        var xPos = this.WorldBoundsMin.x + this.WorldCubeScale.x * cube.x + this.WorldCubeScale.x * 0.5;
        var yPos = this.WorldBoundsMin.y + this.WorldCubeScale.y * cube.y + this.WorldCubeScale.y * 0.5;
        var zPos = this.WorldBoundsMin.z + this.WorldCubeScale.z * cube.z + this.WorldCubeScale.z * 0.5;
        return new THREE.Vector3(xPos, yPos, zPos);
    };
    return PyriteDetailLevel;
})();
//# sourceMappingURL=pyritedetaillevel.js.map