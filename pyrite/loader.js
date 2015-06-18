var PyriteLoader = (function () {
    function PyriteLoader(p) {
        this.loadType = LoadType.CameraDetection;
        this.lastCameraPos = new THREE.Vector3();
        this.detectionChangeDistance = 1;
        this.upgradeConstant = 0.0;
        this.upgradeFactor = 1.05;
        this.downgradeConstant = 0.0;
        this.downgradeFactor = 1.05;
        this.singleLod = false;
        this.pyrite = p;
        this.query = new PyriteQuery(this);
        this.activeCubes = new Dictionary(true);
        this.inactiveCubes = new Dictionary(true);
        this.cubesToLoad = new Dictionary(true);
        this.cubesToUnload = new Dictionary(true);
        this.camera;
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
                        }
                    }
                    // var dl = _this.query.DetailLevels[Config.lod - 1];
                    // dl.loadCubes();
                }
                //_this.loadCamCubes(_this.camera);
                _this.loadFrustumCubes(camera);
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
            //if (this.query) this.query.load3x3("L2", camera.position);
            //this.query.update(camera);
            this.loadFrustumCubes(camera);
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
        var octIntCubeDict = new Dictionary(true);
        //var removeCubeDict = new Dictionary(true);
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
                if(this.cubesToLoad.contains(cubeKey))
                    continue;
                    
                this.cubesToLoad.put(cubeKey, octIntCubes[i]);
            }
            
            if(pLevel2.Value >= Config.maxlod){
                var octIntCubes2 = pLevel.Octree.allIntersections(new THREE.Box3(minVector2, maxVector2));
                // Replace Intersecting Higher Detail Cubes
                for(var i = 0; i < octIntCubes2.length; i++){
                    var pCube = octIntCubes2[i].object;
                    var cubeKey = dl + ',' + pCube.meshName;
                    if(this.cubesToLoad.contains(cubeKey)){
                        this.cubesToLoad.remove(cubeKey);
                        this.cubesToUnload.put(cubeKey, pCube); // mark for unloading
                        var cubeW = pLevel.GetWorldCoordinatesForCube(pCube);
                        var cubeL = pLevel2.GetCubeForWorldCoordinates(cubeW).cube;
                        var cubeV = new THREE.Vector3(cubeL.x + 0.5, cubeL.y + 0.5, cubeL.z + 0.5);
                        var minCubeV = new THREE.Vector3().copy(cubeV).sub(boundBoxVector);
                        var maxCubeV = new THREE.Vector3().copy(cubeV).add(boundBoxVector);
                        
                        var q = pLevel2.Octree.allIntersections(new THREE.Box3(minCubeV, maxCubeV));
                        for(var qi = 0; qi < q.length; qi++){
                            var pCube2 = q[qi].object;
                            var cubeKey2 =  dl2 + ',' + pCube2.meshName;        
                            if(this.cubesToLoad.contains(cubeKey2))
                                continue;
                            
                            this.cubesToLoad.put(cubeKey2, q[qi]);          
                        }
                    }
                }
            }

        }
        
        var _this = this;

        if(this.cubesToLoad.length() > 0){
            this.cubesToLoad.iterate(function(k, v){
                var intersection = v;
                var pCube = intersection.object;
                var dlIndex = _this.query.DetailLevels.indexOf(pCube.detailLevel);
                var pLevel = _this.query.DetailLevels[dlIndex];
                //var cubePos = pCube.cube.worldCoords;
                if(!pCube.isLoaded){
                    pCube.init(_this.pyrite.scene, pLevel.Octree, false);
                    pCube.load(function (){
                        _this.activeCubes.put(k, pCube);
                    });
                }
            });
        }
        
        this.cubesToLoad.clearAll();
        
        if(this.cubesToUnload.length() > 0){
            this.cubesToUnload.iterate(function(k, v){
                if(v.isLoaded)
                    v.unload();
            });
        }
        
        this.cubesToUnload.clearAll();

    };
    PyriteLoader.prototype.loadFrustumCubes = function(camera){
        var cubesToLoad = new Dictionary(true);
        var cubesToUnload = new Dictionary(true);
        
        var _this = this;
        camera.updateMatrix();
        camera.updateProjectionMatrix();
        var vf = new THREE.Frustum();
        vf.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
        
        for (var dl = this.query.DetailLevels.length - 1; dl >= 0; dl--) {
            var detailLevel = this.query.DetailLevels[dl];
            var nextdl = this.query.DetailLevels[dl - 1];
            
            for(var c = 0; c < detailLevel.Cubes.length; c++){
                var cube = detailLevel.Cubes[c];
                var cubeKey = dl + ',' + cube.meshName;
                if(vf.containsPoint(cube.placeholderMesh.position)){
                    // then, we should show it if it is as the correct distance for the LOD from the camera
                    var distance = camera.position.distanceTo(cube.placeholderMesh.position);
                    if(distance < detailLevel.UpgradeDistance){
                        // if there is a higher DL, then we want to check for unloading
                        if(nextdl){
                            if(distance < nextdl.UpgradeDistance){
                                if(cube.isLoaded){
                                    cubesToUnload.put(cubeKey, cube);
                                };
                                continue; // defer to the next highest DL    
                            }
                        }
                        if(!cube.isLoaded){
                            cubesToLoad.put(cubeKey, cube);
                        };
                    }
                    else if (distance > detailLevel.DowngradeDistance){
                        if(cube.isLoaded){
                            cubesToUnload.put(cubeKey, cube);
                        };
                    }
                }
            };
        };
        
        if(cubesToLoad.length() > 0){
            cubesToLoad.iterate(function(k, v){
                var pCube = v;
                var dlIndex = _this.query.DetailLevels.indexOf(pCube.detailLevel);
                var pLevel = _this.query.DetailLevels[dlIndex];
                //var cubePos = pCube.cube.worldCoords;
                if(!pCube.isLoaded){
                    pCube.init(_this.pyrite.scene, pLevel.Octree, false);
                    pCube.load(function (){
                        //_this.activeCubes.put(k, pCube);
                    });
                }
            });
        }
        
        //this.cubesToLoad.clearAll();
        
        if(cubesToUnload.length() > 0){
            cubesToUnload.iterate(function(k, v){
                if(v.isLoaded)
                    v.unload();
            });
        }
        
        //this.cubesToUnload.clearAll();
        
    };
    PyriteLoader.prototype.loadInitialLOD = function (dl) {
    };
    return PyriteLoader;
})();
var LoadType;
(function (LoadType) {
    LoadType[LoadType["CameraDetection"] = 0] = "CameraDetection";
    LoadType[LoadType["ThreeByThree"] = 1] = "ThreeByThree";
    LoadType[LoadType["Octree"] = 2] = "Octree";
})(LoadType || (LoadType = {}));