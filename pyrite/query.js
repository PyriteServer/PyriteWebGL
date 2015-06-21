var PyriteQuery = (function () {
    function PyriteQuery(loader) {
        this.DetailLevels = new Array();
        this.upgradeConstant = 0.0;
        this.upgradeFactor = 1.15;
        this.downgradeConstant = 0.0;
        this.downgradeFactor = 1.25;
        this.initialLoad = true;
        this.activeCubes = new Array();
        this.loader = loader;
        this.metaData = false;
        this.frameIndex = 0;
    }
    PyriteQuery.prototype.addActiveCube = function (cubeContainer) {
        if (!this.containsActiveCube(cubeContainer))
            this.activeCubes.push(cubeContainer);
    };
    PyriteQuery.prototype.removeActiveCube = function (cubeContainer) {
        if (this.containsActiveCube(cubeContainer))
            this.activeCubes.splice(this.activeCubes.indexOf(cubeContainer), 1);
    };
    PyriteQuery.prototype.containsActiveCube = function (cubeContainer) {
        var index = this.activeCubes.indexOf(cubeContainer);
        return index > -1;
    };
    PyriteQuery.prototype.update = function(camera) {
        var _this = this;
        // if (this.activeCubes.length >= this.DetailLevels[this.DetailLevels.length - 1].Cubes.length) {
        //     // if(this.frameIndex < this.activeCubes.length){
        //     //     
        //     //     this.frameIndex++;
        //     // }
        //     // for(var i = 0; i < this.activeCubes.length; i++){
        //     //     var cube = this.activeCubes[i];
        //     //     if (cube.upgradable() && cube.shouldUpgrade(camera.position)) {
        //     //         if (!cube.isLoaded && !cube.isLoading) {
        //     //             //c.init(this.loader.pyrite.scene, c.detailLevel.Octree);
        //     //             // var co = Coroutine(function* (cube){
        //     //             //     yield cube.load()
        //     //             //     }, cube);
        //     //             
        //     //             yield cube.load(function () { });
        //     //             
        //     //         }
        //     //         else if (!cube.isLoading) {
        //     //             // Coroutine(function* (cube){
        //     //             //     yield that.upgradeCubeLod(cube);
        //     //             //     //yield;
        //     //             // }, cube);
        //     //             yield that.upgradeCubeLod(cube);
        //     //         }
        //     //     }
        //     //     else if (cube.downgradable() && cube.shouldDowngrade(camera.position)) {
        //     //         if (!cube.isLoaded && !cube.isLoading) {
        //     //             //c.init(this.loader.pyrite.scene, c.detailLevel.Octree);
        //     //             //cube.isUpgraded = false;
        //     //             //yield cube.load(function () { });
        //     //         }
        //     //     }
        //     // }
        // }
    };
    PyriteQuery.prototype.upgradeCubeLod = function (container) {
        if (container.detailLevel.isHighestLod())
            return;
        var lod = container.detailLevel.Value - 1;
        var cube = container.cube;
        var newLod = lod - 1;
        var detailLevel = this.DetailLevels[newLod];
        var cubeFactor = this.getNextCubeFactor(lod);
        var x = cube.x, y = cube.y, z = cube.z;
        var min = new THREE.Vector3(x * cubeFactor.x + 0.5, y * cubeFactor.y + 0.5, z * cubeFactor.z + 0.5);
        var max = new THREE.Vector3((x + 1) * cubeFactor.x - 0.5, (y + 1) * cubeFactor.y - 0.5, (z + 1) * cubeFactor.z - 0.5);
        var intersections = detailLevel.Octree.allInstersections(new THREE.Box3(min, max));
        if (intersections && intersections.length > 0) {
            for(var i = 0; i < intersections.length; i++){
                var intersection = intersections[i];
                if (!intersection.object.isLoaded) {
                    intersection.object.isUpgraded = true;
                    intersection.object.load(function () {
                        if (container.isLoaded && intersections.indexOf(i) == intersections.length - 1)
                            container.unload();
                    });
                }
            }
        }
    };
    PyriteQuery.prototype.loadMetadata = function (onLoad) {
        var _this = this;
        var that = this;
        this.versionUrl = Config.server + "sets/" + Config.set + "/" + Config.version + "/";
        $.ajaxSettings.crossDomain = true;
        $.get(this.versionUrl).done(function (r) {
            //console.log(r);
            if (r.status == 'OK') {
                var detailLevels = r.result.detailLevels;
                for (var i = 0; i < detailLevels.length; i++) {
                    var dl = new PyriteDetailLevel(_this.loader.pyrite.scene);
                    dl.Name = detailLevels[i].name;
                    dl.Query = that;
                    var value = parseInt(dl.Name.substring(1));
                    dl.Value = value;
                    dl.SetSize = new THREE.Vector3(detailLevels[i].setSize.x, detailLevels[i].setSize.y, detailLevels[i].setSize.z);
                    dl.TextureSetSize = new THREE.Vector2(detailLevels[i].textureSetSize.x, detailLevels[i].textureSetSize.y);
                    dl.ModelBoundsMax = new THREE.Vector3(detailLevels[i].modelBounds.max.x, detailLevels[i].modelBounds.max.y, detailLevels[i].modelBounds.max.z);
                    dl.ModelBoundsMin = new THREE.Vector3(detailLevels[i].modelBounds.min.x, detailLevels[i].modelBounds.min.y, detailLevels[i].modelBounds.min.z);
                    dl.WorldBoundsMax = new THREE.Vector3(detailLevels[i].worldBounds.max.x, detailLevels[i].worldBounds.max.y, detailLevels[i].worldBounds.max.z);
                    dl.WorldBoundsMin = new THREE.Vector3(detailLevels[i].worldBounds.min.x, detailLevels[i].worldBounds.min.y, detailLevels[i].worldBounds.min.z);
                    dl.WorldCubeScale = new THREE.Vector3(detailLevels[i].worldCubeScale.x, detailLevels[i].worldCubeScale.y, detailLevels[i].worldCubeScale.z);
                    dl.WorldBoundsSize = dl.WorldBoundsMax.sub(dl.WorldBoundsMin);
                    //dl.Cubes = new Array<PyriteCube>();
                    dl.DowngradeDistance = dl.WorldCubeScale.length() * _this.downgradeFactor + _this.downgradeConstant;
                    dl.UpgradeDistance = dl.WorldCubeScale.length() * _this.upgradeFactor + _this.upgradeConstant;
                    // dl.LODUpperThreshold = _this.getLODUpper(dl);
                    // dl.LODLowerThreshold = _this.getLODLower(dl);
                    dl.LODUpperThreshold = 0.95;
                    dl.LODLowerThreshold = 0.35;
                    that.DetailLevels.push(dl);
                    //console.log("Metadata query completed.");
                }
                onLoad();
            }
        });
    };
    PyriteQuery.prototype.getLODUpper = function(dl){
        switch(dl.Value){
          case 1:
          return 1.0;
          break;
          case 2:
          return 0.75;
          break;
          case 3:
          return 0.5;
          break;  
        };
    };
    PyriteQuery.prototype.getLODLower = function(dl){
        switch(dl.Value){
          case 1:
          return 0.80;
          break;
          case 2:
          return 0.60;
          break;
          case 3:
          return 0.11;
          break;  
        };
    };
    PyriteQuery.prototype.loadDetailLevels = function (onLoad) {
        var _this = this;
        var vals = this.DetailLevels;
        vals.forEach(function (dl) {
            var maxboundingboxquery = dl.WorldBoundsMin.x + "," +
                dl.WorldBoundsMin.y + "," +
                dl.WorldBoundsMin.z + "/" +
                dl.WorldBoundsMax.x + "," +
                dl.WorldBoundsMax.y + "," +
                dl.WorldBoundsMax.z;
            var cubesUrl = _this.versionUrl + "query/" + dl.Name + "/" + maxboundingboxquery;
            $.get(cubesUrl).done(function (r) {
                var cubes = r.result;
                //dl.Cubes = new Array<PyriteCube>(cubes.length);
                // TODO: implement Octree classes
                for (var i = 0; i < dl.Cubes.length; i++) {
                    var cubeContainer = new CubeContainer(dl);
                    cubeContainer.cube = new Cube();
                    cubeContainer.cube.x = cubes[i][0];
                    cubeContainer.cube.y = cubes[i][1];
                    cubeContainer.cube.z = cubes[i][2];
                    dl.Cubes.push(cubeContainer);
                }
                onLoad(dl);
                //this.loader.onLoaded(dl);
            });
        });
    };
    PyriteQuery.prototype.setCamera = function (dl) {
        var geometryTransform = (dl.ModelBoundsMax.y) / 2.0;
        var min = new THREE.Vector3(dl.ModelBoundsMin.x, dl.ModelBoundsMin.y, dl.ModelBoundsMin.z);
        var max = new THREE.Vector3(dl.ModelBoundsMax.x, dl.ModelBoundsMax.y, dl.ModelBoundsMax.z);
        var maxmin = new THREE.Vector3().copy(max).sub(min);
        var maxminHalf = new THREE.Vector3().copy(maxmin).divideScalar(2);
        var newCameraPosition = new THREE.Vector3().copy(min).add(maxminHalf);
        newCameraPosition.add(new THREE.Vector3(0, 0, maxmin.z * 1.4));
        //this.loader.pyrite.setCamera(newCameraPosition, new THREE.Euler(0, 0, 0));
    };
    PyriteQuery.prototype.loadAll = function (callback) {
        var _this = this;
        this.loadMetadata(function () {
            var vals = _this.DetailLevels;
            _this.setCamera(vals[0]);
            vals.forEach(function (dl) {
                var maxboundingboxquery = dl.WorldBoundsMin.x + "," +
                    dl.WorldBoundsMin.y + "," +
                    dl.WorldBoundsMin.z + "/" +
                    dl.WorldBoundsMax.x + "," +
                    dl.WorldBoundsMax.y + "," +
                    dl.WorldBoundsMax.z;
                var cubesUrl = _this.versionUrl + "query/" + dl.Name + "/" + maxboundingboxquery;
                $.get(cubesUrl).done(function (r) {
                    var cubes = r.result;
                    for (var i = 0; i < cubes.length; i++) {
                        var cubeContainer = new CubeContainer(dl);
                        cubeContainer.cube = new Cube();
                        cubeContainer.cube.x = cubes[i][0];
                        cubeContainer.cube.y = cubes[i][1];
                        cubeContainer.cube.z = cubes[i][2];
                        cubeContainer.useEbo = Config.fmt == "ebo";
                        cubeContainer.useCtm = Config.fmt == "ctm";
                        cubeContainer.debug = Config.debug == 1;
                        dl.Cubes.push(cubeContainer);
                    }
                    dl.loadCubeContainers();
                    callback();
                    // if (dl.isLowestLod()) {
                    //     dl.loadCubes();
                    // }
                    // else {
                    //     dl.loadCubeContainers();
                    // }
                });
            });
        });
    };
    PyriteQuery.prototype.loadLod = function (lod) {
        var _this = this;
        var scope = this;
        this.loadMetadata(function () {
            var vals = _this.DetailLevels;
            vals.forEach(function (dl) {
                if (dl.Value == Config.lod) {
                    _this.setCamera(dl);
                    var maxboundingboxquery = dl.WorldBoundsMin.x + "," +
                        dl.WorldBoundsMin.y + "," +
                        dl.WorldBoundsMin.z + "/" +
                        dl.WorldBoundsMax.x + "," +
                        dl.WorldBoundsMax.y + "," +
                        dl.WorldBoundsMax.z;
                    var cubesUrl = _this.versionUrl + "query/" + dl.Name + "/" + maxboundingboxquery;
                    $.get(cubesUrl).done(function (r) {
                        var cubes = r.result;
                        for (var i = 0; i < cubes.length; i++) {
                            var cubeContainer = new CubeContainer(dl);
                            cubeContainer.cube = new Cube();
                            cubeContainer.cube.x = cubes[i][0];
                            cubeContainer.cube.y = cubes[i][1];
                            cubeContainer.cube.z = cubes[i][2];
                            cubeContainer.useEbo = Config.fmt == "ebo";
                            cubeContainer.useCtm = Config.fmt == "ctm";
                            cubeContainer.debug = Config.debug == 1;
                            dl.Cubes.push(cubeContainer);
                        }
                        dl.loadCubes();
                    });
                }
            });
        });
    };
    PyriteQuery.prototype.load3x3 = function (reference, queryPosition) {
        var scope = this;
        this.loadMetadata(function () {
            //dl.loadCubes();
            var url = scope.versionUrl + 'query/3x3/' + reference + '/' + queryPosition.x + ',' + queryPosition.y + ',' + queryPosition.z;
            $.get(url).done(function (r) {
                if (r.status == 'OK') {
                    var cubeGroups = r.result;
                    for (var i = 0; i < cubeGroups.length; i++) {
                        var group = cubeGroups[i];
                        var lodName = group.name;
                        var detailLevelIndex = parseInt(lodName.substring(1)) - 1;
                        var detailLevel = scope.DetailLevels[detailLevelIndex];
                        detailLevel.hideAllCubes();
                        var cubes = group.cubes;
                        for (var c = 0; c < cubes.length; c++) {
                            var x = cubes[c][0];
                            var y = cubes[c][1];
                            var z = cubes[c][2];
                            if (detailLevel.cubeExists(x, y, x)) {
                                var cubeContainer = detailLevel.getCube(x, y, z);
                            }
                            else {
                                var cubeContainer = new CubeContainer(detailLevel);
                                cubeContainer.cube = new Cube();
                                cubeContainer.cube.x = x;
                                cubeContainer.cube.y = y;
                                cubeContainer.cube.z = z;
                                cubeContainer.useEbo = Config.fmt == "ebo";
                                cubeContainer.useCtm = Config.fmt == "ctm";
                                cubeContainer.debug = Config.debug == 1;
                                detailLevel.Cubes.push(cubeContainer);
                            }
                        }
                        detailLevel.loadCubes();
                    }
                }
                else {
                    console.log(r.status);
                }
            }).fail(function (error) {
                console.log(error);
            });
        });
    };
    PyriteQuery.prototype.GetModelPath = function (lod, x, y, z) {
        //return string.Format("{0}/sets/{1}/{2}/models/{3}/{4},{5},{6}", _apiUrl, SetName, Version, lod, x, y, z);
        return this.versionUrl + "models/" + lod + "/" + x + "," + y + "," + z;
    };
    PyriteQuery.prototype.GetTexturePath = function (lod, x, y) {
        //return string.Format("{0}/sets/{1}/{2}/models/{3}/{4},{5},{6}", _apiUrl, SetName, Version, lod, x, y, z);
        return this.versionUrl + "textures/" + lod + "/" + x + "," + y;
    };
    PyriteQuery.prototype.getNextCubeFactor = function (lodIndex) {
        if (lodIndex == 0)
            return new THREE.Vector3(1, 1, 1);
        var currentSetSize = this.DetailLevels[lodIndex].SetSize;
        var nextSetSize = this.DetailLevels[lodIndex - 1].SetSize;
        return new THREE.Vector3(nextSetSize.x / currentSetSize.x, nextSetSize.y / currentSetSize.y, nextSetSize.z / currentSetSize.z);
    };
    PyriteQuery.prototype.getPreviousCubeFactor = function (lodIndex) {
        if (lodIndex == this.DetailLevels.length - 1)
            return new THREE.Vector3(1, 1, 1);
        var currentSetSize = this.DetailLevels[lodIndex].SetSize;
        var prevSetSize = this.DetailLevels[lodIndex + 1].SetSize;
        return new THREE.Vector3(currentSetSize.x / prevSetSize.x, currentSetSize.y / prevSetSize.y, currentSetSize.z / prevSetSize.z);
    };
    return PyriteQuery;
})();