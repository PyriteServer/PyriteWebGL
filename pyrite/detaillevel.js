var PyriteDetailLevel = (function () {
    function PyriteDetailLevel(scene) {
        this.Cubes = new Array();
        //VisibleCubes: Array<PyriteCube> = new Array(0);
        this.textureLoadingQueue = new Array(0);
        this.Octree = new Octree();
        this.UseOctree = false;
        this.ready = false;
        this.lod = new THREE.LOD();
        this.scene = scene;
        this.WorldBoundsMin;
        this.WorldBoundsMax;
        this.distance;
        this.UpgradeDistance;
        this.DowngradeDistance;
        this.LODUpperThreshold;
        this.LODLowerThreshold;
        this.worldCenterPos;
        //this.worker = new Worker('dlworker.js');
    }
    PyriteDetailLevel.prototype.isHighestLod = function () {
        return this == this.Query.DetailLevels[0];
    };
    PyriteDetailLevel.prototype.isLowestLod = function () {
        var largestIndex = this.Query.DetailLevels.length - 1;
        return this == this.Query.DetailLevels[largestIndex];
    };
    PyriteDetailLevel.prototype.update = function (camera) {
        // if (this.textureLoadingQueue.length == this.Cubes.length) {
        // }
        // 
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
    };
    PyriteDetailLevel.prototype.load = function () {
        var maxboundingboxquery = this.WorldBoundsMin.x + "," +
            this.WorldBoundsMin.y + "," +
            this.WorldBoundsMin.z + "/" +
            this.WorldBoundsMax.x + "," +
            this.WorldBoundsMax.y + "," +
            this.WorldBoundsMax.z;
        var cubesUrl = this.Query.versionUrl + "query/" + this.Name + "/" + maxboundingboxquery;
        var that = this;
        $.get(cubesUrl).done(function (r) {
            var cubes = r.result;
            //that.Cubes = new Array<PyriteCube>(cubes.length);
            // TODO: implement Octree classes
            //for (var i = 0; i < that.Cubes.length; i++) {
            //    var cube = new PyriteCube(that);
            //    cube.X = cubes[i][0];
            //    cube.Y = cubes[i][1];
            //    cube.Z = cubes[i][2];
            //    //that.Cubes[i] = cube;
            //    var min = new THREE.Vector3(cube.X, cube.Y, cube.Z);
            //    var max = min.add(new THREE.Vector3(1, 1, 1));
            //    //cube.BoundingBox = new THREE.Box3(min, max);
            //    //this.Octree.add(cube.Mesh);
            //}
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
            this.Cubes[i].hideCube();
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
        //var initCount = 0;
        var cubes = this.Cubes;
        cubes.forEach(function (c) {
            c.cube.worldCoords = _this.GetWorldCoordinatesForCube(c.cube);
            c.init(_this.scene, _this.Octree, false);
            c.load(function () {
                //that.textureLoadingQueue.push(c);
                // var key = _this.Value + ',' + c.meshName;
                // _this.Query.loader.activeCubes.put(key, c);
            });
            //that.threadPool.run(function () { c.load() }, {});
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
    PyriteDetailLevel.prototype.loadCubeContainers = function () {
        var _this = this;
        var cubes = this.Cubes;
        for(var i = 0; i < cubes.length; i++){
            cubes[i].cube.worldCoords = _this.GetWorldCoordinatesForCube(cubes[i].cube);
            var worldCoords = cubes[i].cube.worldCoords;
            cubes[i].cube.correctedWorldCoords = new THREE.Vector3(worldCoords.x, worldCoords.z + 450, worldCoords.y);
            cubes[i].init(_this.scene, _this.Octree, false);
        }
    };
    PyriteDetailLevel.prototype.TextureCoordinatesForCube = function (cubeX, cubeY) {
        var textureXPosition = (cubeX / (this.SetSize.x / this.TextureSetSize.x));
        var textureYPosition = (cubeY / (this.SetSize.y / this.TextureSetSize.y));
        return new THREE.Vector2(Math.floor(textureXPosition), Math.floor(textureYPosition));
    };
    PyriteDetailLevel.prototype.GetWorldCoordinatesForCube = function(cube){
      return this.GetWorldCoordinatesForCubeCoords(cube.x, cube.y, cube.z);
    };
    PyriteDetailLevel.prototype.GetWorldCoordinatesForCubeVector = function(vector){
      return this.GetWorldCoordinatesForCubeCoords(vector.x, vector.y, vector.z);
    };
    PyriteDetailLevel.prototype.GetWorldCoordinatesForCubeCoords = function (x, y, z) {
        var xPos = this.WorldBoundsMin.x + this.WorldCubeScale.x * x +
            this.WorldCubeScale.x * 0.5;
        var yPos = this.WorldBoundsMin.y + this.WorldCubeScale.y * y +
            this.WorldCubeScale.y * 0.5;
        var zPos = this.WorldBoundsMin.z + this.WorldCubeScale.z * z +
            this.WorldCubeScale.z * 0.5;
        return new THREE.Vector3(xPos, yPos, zPos);
    };
    PyriteDetailLevel.prototype.GetCubeForWorldCoordinates = function (pos) {
        var cx = ((pos.x - this.WorldBoundsMin.x) / this.WorldCubeScale.x);
        var cy = ((pos.y - this.WorldBoundsMin.y) / this.WorldCubeScale.y);
        var cz = ((pos.z - this.WorldBoundsMin.z) / this.WorldCubeScale.z);
        if (this.cubeExists(cx, cy, cz)) {
            return this.getCube(cx, cy, cz);
        }
        else {
            var newContainer = new CubeContainer(this);
            newContainer.cube = new Cube();
            newContainer.cube.x = cx;
            newContainer.cube.y = cy;
            newContainer.cube.z = cz;
            newContainer.cube.worldCoords = this.GetWorldCoordinatesForCube(newContainer.cube);
            newContainer.bounds = new CubeBounds(newContainer);
            newContainer.DetailLevel = this;
            return newContainer;
        }
    };
    PyriteDetailLevel.prototype.getCube = function (x, y, z) {
        var cube = null;
        this.Cubes.forEach(function (c) {
            if (c.cube.x == x && c.cube.y == y && c.cube.z == z)
                cube = c;
        });
        return cube;
    };
    return PyriteDetailLevel;
})();