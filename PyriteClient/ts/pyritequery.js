var PyriteQuery = (function () {
    function PyriteQuery(loader) {
        this.loader = loader;
        this.DetailLevels = new Dictionary([]);
        this.metaData = false;
    }
    PyriteQuery.prototype.loadMetadata = function () {
        var _this = this;
        // let's try a jQuery call!
        var that = this;
        this.versionUrl = Config.server + "sets/" + Config.set + "/" + Config.version + "/";
        $.get(this.versionUrl).done(function (r) {
            console.log(r);
            if (r.status == 'OK') {
                //that.levelsOfDetail = r.result.detailLevels;
                var detailLevels = r.result.detailLevels;
                for (var i = 0; i < detailLevels.length; i++) {
                    //var lod = new PyriteDetailLevel();
                    //lod.Name = that.levelsOfDetail[i].;
                    var dl = new PyriteDetailLevel(_this.loader.pyrite.scene);
                    //dl.Octree = new THREE.Octree({
                    //    undeferred: false,
                    //    depthMax: Infinity,
                    //    objectsThreshold: 8,
                    //    overlapPct: 0.15,
                    //    scene: this.loader.pyrite.scene
                    //});
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
                    that.DetailLevels.add(dl.Value.toString(), dl);
                }
                //that.metaData = true;
                console.log("Metadata query completed.");
                that.loadDetailLevels();
            }
        });
    };
    PyriteQuery.prototype.loadDetailLevels = function () {
        var _this = this;
        var vals = this.DetailLevels._values;
        vals.forEach(function (dl) {
            var maxboundingboxquery = dl.WorldBoundsMin.x + "," + dl.WorldBoundsMin.y + "," + dl.WorldBoundsMin.z + "/" + dl.WorldBoundsMax.x + "," + dl.WorldBoundsMax.y + "," + dl.WorldBoundsMax.z;
            var cubesUrl = _this.versionUrl + "query/" + dl.Name + "/" + maxboundingboxquery;
            $.get(cubesUrl).done(function (r) {
                var cubes = r.result;
                dl.Cubes = new Array(cubes.length);
                for (var i = 0; i < dl.Cubes.length; i++) {
                    var cube = new PyriteCube(dl);
                    cube.X = cubes[i][0];
                    cube.Y = cubes[i][1];
                    cube.Z = cubes[i][2];
                    dl.Cubes[i] = cube;
                }
                _this.loader.onLoaded(dl);
            });
        });
        //this.loader.onLoaded();
    };
    PyriteQuery.prototype.loadAll = function () {
        this.loadMetadata();
        //while (!this.metaData) {
        //    console.log("waiting for metadata");
        //}
    };
    PyriteQuery.prototype.GetModelPath = function (lod, x, y, z) {
        //return string.Format("{0}/sets/{1}/{2}/models/{3}/{4},{5},{6}", _apiUrl, SetName, Version, lod, x, y, z);
        return this.versionUrl + "models/" + lod + "/" + x + "," + y + "," + z;
    };
    PyriteQuery.prototype.GetTexturePath = function (lod, x, y) {
        //return string.Format("{0}/sets/{1}/{2}/models/{3}/{4},{5},{6}", _apiUrl, SetName, Version, lod, x, y, z);
        return this.versionUrl + "textures/" + lod + "/" + x + "," + y;
    };
    return PyriteQuery;
})();
//# sourceMappingURL=pyritequery.js.map