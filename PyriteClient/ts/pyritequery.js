var PyriteQuery = (function () {
    function PyriteQuery(loader) {
        this.DetailLevels = new Array();
        this.upgradeConstant = 0.0;
        this.upgradeFactor = 1.05;
        this.downgradeConstant = 0.0;
        this.downgradeFactor = 1.05;
        this.initialLoad = true;
        this.loader = loader;
        this.metaData = false;
    }
    PyriteQuery.prototype.update = function (camera) {
        var that = this;
        this.DetailLevels.forEach(function (dl) {
            //dl.update(camera);
            dl.Cubes.forEach(function (c) {
                if (c.upgradable() && c.shouldUpgrade(camera.position)) {
                    if (!c.isLoaded && !c.isLoading) {
                        c.load();
                    }
                    else if (!c.isLoading) {
                        that.upgradeCubeLod(c);
                    }
                }
                else if (c.downgradable() && c.shouldDowngrade(camera.position)) {
                }
            });
        });
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
        if (intersections) {
            intersections.forEach(function (i) {
            });
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
                    that.DetailLevels.push(dl);
                    console.log("Metadata query completed.");
                }
                onLoad();
            }
        });
    };
    PyriteQuery.prototype.loadDetailLevels = function (onLoad) {
        var _this = this;
        var vals = this.DetailLevels;
        vals.forEach(function (dl) {
            var maxboundingboxquery = dl.WorldBoundsMin.x + "," + dl.WorldBoundsMin.y + "," + dl.WorldBoundsMin.z + "/" + dl.WorldBoundsMax.x + "," + dl.WorldBoundsMax.y + "," + dl.WorldBoundsMax.z;
            var cubesUrl = _this.versionUrl + "query/" + dl.Name + "/" + maxboundingboxquery;
            $.get(cubesUrl).done(function (r) {
                var cubes = r.result;
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
    PyriteQuery.prototype.loadAll = function () {
        var _this = this;
        this.loadMetadata(function () {
            var vals = _this.DetailLevels;
            vals.forEach(function (dl) {
                var maxboundingboxquery = dl.WorldBoundsMin.x + "," + dl.WorldBoundsMin.y + "," + dl.WorldBoundsMin.z + "/" + dl.WorldBoundsMax.x + "," + dl.WorldBoundsMax.y + "," + dl.WorldBoundsMax.z;
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
                        cubeContainer.debug = Config.debug == 1;
                        dl.Cubes.push(cubeContainer);
                    }
                    if (dl.isLowestLod()) {
                        dl.loadCubes();
                    }
                });
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
                            if (detailLevel.Cubes.some(function (value, index, values) {
                                return value.cube.x == x && value.cube.y == y && value.cube.z == z;
                            })) {
                                break;
                            }
                            else {
                                var x = cubes[c][0], y = cubes[c][1], z = cubes[c][2];
                                if (detailLevel.cubeExists(x, y, z)) {
                                    //detailLevel.removeCube(x, y, z);
                                    //detailLevel.hideCube(x, y, z);
                                    detailLevel.showCube(true, x, y, z);
                                }
                                else {
                                    var cube = new PyriteCube(detailLevel);
                                    cube.X = cubes[c][0];
                                    cube.Y = cubes[c][1];
                                    cube.Z = cubes[c][2];
                                    detailLevel.addCube(cube);
                                }
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
//# sourceMappingURL=pyritequery.js.map