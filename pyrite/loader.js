var PyriteLoader = (function () {
    function PyriteLoader(p) {
        this.loadType = LoadType.CameraDetection;
        this.lastCameraPos = new THREE.Vector3();
        this.detectionChangeDistance = 0.5;
        this.upgradeConstant = 0.0;
        this.upgradeFactor = 1.05;
        this.downgradeConstant = 0.0;
        this.downgradeFactor = 1.05;
        this.singleLod = false;
        this.pyrite = p;
        this.query = new PyriteQuery(this);
        this.camera;
        this.cache = new MicroCache();
        this.textureState = new MicroCache();
        this.toggleYZ = new THREE.Matrix4();
        this.toggleYZ.set(
            1,0,0,0,
            0,0,1,0,
            0,-1,0,0,
            0,0,0,1
        );
    }
    PyriteLoader.prototype.load = function (camera) {
        this.camera = camera;
        // if (typeof Config.lod !== 'undefined') {
        //     this.singleLod = true;
        //     this.query.loadLod(Config.lod);
        // }
        // else if (this.loadType == LoadType.CameraDetection || this.loadType == LoadType.Octree) {
            var _this = this;

            this.query.loadAll(function (){
                if(Config.showcubes == 1){
                    for(var i =0; i < _this.query.DetailLevels.length; i++){
                        var dl = _this.query.DetailLevels[i];
                        if(dl.Value == Config.lod){
                            dl.loadCubes();
                            _this.loadCubes(camera);
                        }
                    }
                }else{
                    //_this.loadCamCubes(_this.camera);
                    _this.loadCubes(camera);
                }
            });
            //this.query.load3x3("L2", this.pyrite.camera.position);
        // }
        // else {
        // }
    };
    PyriteLoader.prototype.update = function (camera) {
        if (this.singleLod)
            return; // if there is a lod set in the query string, then we won't upgrade

         var _this = this;
        if (this.query) {
            switch (this.loadType) {
                case LoadType.CameraDetection:
                    this.updateCameraDetection(camera);
                    break;
                case LoadType.Octree:
                    this.updateOctree(camera);
                    break;
                case LoadType.ThreeByThree:
                    this.updateThreeByThree(camera);
                    break;
            }
            ;
        }
    };
    PyriteLoader.prototype.updateCameraDetection = function (camera) {
        if (this.lastCameraPos.distanceTo(camera.position) > this.detectionChangeDistance) {
            this.loadCubes(camera);
        }
    };
    PyriteLoader.prototype.updateThreeByThree = function (camera) {
        if (this.lastCameraPos.distanceTo(camera.position) > this.detectionChangeDistance) {
            if (this.query)
                this.query.load3x3("L2", camera.position);
        }
    };
    PyriteLoader.prototype.updateOctree = function (camera) {
        if (this.lastCameraPos.distanceTo(camera.position) > this.detectionChangeDistance) {
            this.loadCamCubes(camera);
        }
    };
    PyriteLoader.prototype.loadCamCubes = function (camera) {
        var cubesToLoad = new Dictionary(true);
        var cubesToUnload = new Dictionary(true);
        var boundBoxVector = new THREE.Vector3(1, 1, 1);

        for (var dl = this.query.DetailLevels.length - 1; dl > 0; dl--) {
            var pLevel = this.query.DetailLevels[dl];
            if(pLevel.Value < Config.maxlod) continue; // skip over processing the detail level if it is great than the max lod
            var dl2 = dl - 1;
            var pLevel2 = this.query.DetailLevels[dl2];
            var camPos = camera.position;
            var cPos = pLevel.GetCubeForWorldCoordinates(camPos);
            var cPos2 = pLevel2.GetCubeForWorldCoordinates(camPos);
            var cubeCamVector = new THREE.Vector3(cPos.cube.x + 0.5, cPos.cube.y + 0.5, cPos.cube.z + 0.5);
            var cubeCamVector2 = new THREE.Vector3(cPos2.cube.x + 0.5, cPos2.cube.y + 0.5, cPos2.cube.z + 0.5);
            var minVector = new THREE.Vector3().copy(cubeCamVector).sub(boundBoxVector);
            var maxVector = new THREE.Vector3().copy(cubeCamVector).add(boundBoxVector);
            var minCube2 = new THREE.Vector3().copy(cubeCamVector2).sub(boundBoxVector);
            var maxCube2= new THREE.Vector3().copy(cubeCamVector2).add(boundBoxVector);
            var minWorld2 = pLevel2.GetWorldCoordinatesForCubeVector(minCube2);
            var maxWorld2 = pLevel2.GetWorldCoordinatesForCubeVector(maxCube2);
            var minCubeC2 = pLevel.GetCubeForWorldCoordinates(minWorld2);
            var maxCubeC2 = pLevel.GetCubeForWorldCoordinates(maxWorld2);
            var minVector2 = new THREE.Vector3(minCubeC2.x + 0.5, minCubeC2.y + 0.5, minCubeC2.z + 0.5);
            var maxVector2 = new THREE.Vector3(maxCubeC2.x + 0.5, maxCubeC2.y + 0.5, maxCubeC2.z + 0.5);

            var octIntCubes = pLevel.Octree.allIntersections(new THREE.Box3(minVector, maxVector));

            // Load current level cubes
            for(var i = 0; i < octIntCubes.length; i++){
                var pCube = octIntCubes[i].object;
                var cubeKey = dl + ',' + pCube.meshName;
                if(cubesToLoad.contains(cubeKey))
                    continue;

                cubesToLoad.put(cubeKey, octIntCubes[i]);
            }

            if(pLevel2.Value >= Config.maxlod){
                var octIntCubes2 = pLevel.Octree.allIntersections(new THREE.Box3(minVector2, maxVector2));
                // Replace Intersecting Higher Detail Cubes
                for(var i = 0; i < octIntCubes2.length; i++){
                    var pCube = octIntCubes2[i].object;
                    var cubeKey = dl + ',' + pCube.meshName;
                    if(cubesToLoad.contains(cubeKey)){
                        cubesToLoad.remove(cubeKey);
                        cubesToUnload.put(cubeKey, pCube); // mark for unloading
                        var cubeW = pLevel.GetWorldCoordinatesForCube(pCube);
                        var cubeL = pLevel2.GetCubeForWorldCoordinates(cubeW).cube;
                        var cubeV = new THREE.Vector3(cubeL.x + 0.5, cubeL.y + 0.5, cubeL.z + 0.5);
                        var minCubeV = new THREE.Vector3().copy(cubeV).sub(boundBoxVector);
                        var maxCubeV = new THREE.Vector3().copy(cubeV).add(boundBoxVector);

                        var q = pLevel2.Octree.allIntersections(new THREE.Box3(minCubeV, maxCubeV));
                        for(var qi = 0; qi < q.length; qi++){
                            var pCube2 = q[qi].object;
                            var cubeKey2 =  dl2 + ',' + pCube2.meshName;
                            if(cubesToLoad.contains(cubeKey2))
                                continue;

                            cubesToLoad.put(cubeKey2, q[qi]);
                        }
                    }
                }
            }

        }

        var _this = this;

        if(cubesToLoad.length() > 0){
            cubesToLoad.iterate(function(k, v){
                var intersection = v;
                var cube = intersection.object;
                var pLevel = cube.detailLevel;
                if(!cube.isLoaded && !cube.isLoading){
                    cube.init(_this.pyrite.scene, pLevel.Octree, false);
                    cube.load(function (){
                        //_this.activeCubes.put(k, cube);
                    });
                }
            });
        }

        if(cubesToUnload.length() > 0){
            cubesToUnload.iterate(function(k, v){
                if(v.isLoaded && !v.isUnloading)
                    v.unload();
            });
        }
    };
    PyriteLoader.prototype.loadCubes = function(cameraRig){
        var camera = cameraRig.children[0];
        var cubesToLoad = new Array();
        var cubesToUnload = new Array();

        var _this = this;

        var vf = new THREE.Frustum();
        vf.setFromMatrix(new THREE.Matrix4().copy(camera.projectionMatrix).multiply(camera.matrixWorldInverse));

        for (var dl = this.query.DetailLevels.length - 1; dl >= 0; dl--) {
            var detailLevel = this.query.DetailLevels[dl];
            var nextdl = this.query.DetailLevels[dl - 1];
            var prevdl = this.query.DetailLevels[dl + 1];

            for(var c = 0; c < detailLevel.Cubes.length; c++){

                var cube = detailLevel.Cubes[c];
                var searchPostionA = new THREE.Vector3().copy(cube.placeholderMesh.position).add(cube.placeholderMesh.geometry.boundingBox.min);
                var searchPostionB = new THREE.Vector3().copy(cube.placeholderMesh.position).add(cube.placeholderMesh.geometry.boundingBox.max);
                if(vf.intersectsObject(cube.placeholderMesh)){
                //if(vf.containsPoint(cube.placeholderMesh.position)){
                //if(vf.containsPoint(cube.placeholderMesh.position) || vf.containsPoint(searchPostionA) || vf.containsPoint(searchPostionB)){
                //if(vf.containsPoint(cube.centerPosition)){
                    //console.log('this cube is in the camera frustum: ' + cube.meshName);
                    var distance = cameraRig.position.distanceTo(cube.placeholderMesh.position);
                    //var bbHeight = cube.placeholderMesh.geometry.boundingBox.max.x - cube.placeholderMesh.geometry.boundingBox.min.x;
                    var bbheight = detailLevel.WorldCubeScale.y;
                    var height = 2 * Math.tan( Math.PI / 8) * distance;
                    var vpPercentage = bbheight / height;

                    var lower = typeof prevdl !== 'undefined' ?  detailLevel.WorldCubeScale.y / prevdl.WorldCubeScale.y : 0.35;
                    lower *= 1.1;
                    var upper = (1 + lower) * 1.1;
                    if(vpPercentage <= upper && vpPercentage > lower){
                        if(!cube.isLoaded)
                            cubesToLoad.push(cube);
                    }else if (vpPercentage <= lower || vpPercentage > upper && nextdl){
                        // if(prevdl) // only unload if there is a lower detail level
                        //     cubesToUnload.put(cubeKey, cube);
                        if(cube.isLoaded)
                            cubesToUnload.push(cube);
                    }
                }else{
                    if(cube.isLoaded)
                        cubesToUnload.push(cube);
                }


                // var distance = cameraRig.position.distanceTo(cube.placeholderMesh.position);
                // //var bbHeight = cube.placeholderMesh.geometry.boundingBox.max.x - cube.placeholderMesh.geometry.boundingBox.min.x;
                // var bbheight = detailLevel.WorldCubeScale.y;
                // var height = 2 * Math.tan( Math.PI / 8) * distance;
                // var vpPercentage = bbheight / height;
                //
                // var lower = typeof prevdl !== 'undefined' ?  detailLevel.WorldCubeScale.y / prevdl.WorldCubeScale.y : 0.35;
                // var upper = 1 + lower;
                // if(vpPercentage <= upper && vpPercentage > lower){
                //     if(!cube.isLoaded)
                //         cubesToLoad.push(cube);
                // }else if (vpPercentage <= lower || vpPercentage > upper && nextdl){
                //     // if(prevdl) // only unload if there is a lower detail level
                //     //     cubesToUnload.put(cubeKey, cube);
                //     if(cube.isLoaded)
                //         cubesToUnload.push(cube);
                // }


                // if(vpPercentage <= detailLevel.LODUpperThreshold && vpPercentage > detailLevel.LODLowerThreshold){
                //     if(!cube.isLoaded)
                //         cubesToLoad.push(cube);
                // }else if (vpPercentage <= detailLevel.LODLowerThreshold || vpPercentage > detailLevel.LODUpperThreshold && nextdl){
                //     // if(prevdl) // only unload if there is a lower detail level
                //     //     cubesToUnload.put(cubeKey, cube);
                //     if(cube.isLoaded)
                //         cubesToUnload.push(cube);
                // }
            };
        };

        if(cubesToLoad.length > 0){
            cubesToLoad.forEach(function(cube){
                var pLevel = cube.detailLevel;
                if(!cube.isLoaded && !cube.isLoading){
                    cube.init(_this.pyrite.scene, pLevel.Octree, false);
                    cube.load(function (){
                        //_this.activeCubes.put(k, pCube);
                    });
                }
            });
        }

        if(cubesToUnload.length > 0){
            cubesToUnload.forEach(function(cube){
                if(cube.isLoaded && !cube.isUnloading)
                    cube.unload();
            });
        }
    };
    return PyriteLoader;
})();
var LoadType;
(function (LoadType) {
    LoadType[LoadType["CameraDetection"] = 0] = "CameraDetection";
    LoadType[LoadType["ThreeByThree"] = 1] = "ThreeByThree";
    LoadType[LoadType["Octree"] = 2] = "Octree";
})(LoadType || (LoadType = {}));
