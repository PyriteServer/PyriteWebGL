var PyriteLoader = (function () {
    function PyriteLoader(p) {
        this.loadType = LoadType.Octree;
        this.lastCameraPos = new THREE.Vector3();
        this.detectionChangeDistance = 10;
        this.upgradeConstant = 0.0;
        this.upgradeFactor = 1.05;
        this.downgradeConstant = 0.0;
        this.downgradeFactor = 1.05;
        this.singleLod = false;
        this.pyrite = p;
        this.query = new PyriteQuery(this);
        this.activeCubes = new Dictionary(true);
        this.inactiveCubes = new Dictionary(true);
        this.camera;
    }
    PyriteLoader.prototype.load = function (camera) {
        this.camera = camera;
        if (typeof Config.lod !== 'undefined') {
            this.singleLod = true;
            this.query.loadLod(Config.lod);
        }
        else if (this.loadType == LoadType.CameraDetection || this.loadType == LoadType.Octree) {
            var _this = this;
            this.query.loadAll(function (){
                _this.loadCamCubes(_this.camera);
            });
            //this.query.load3x3("L2", this.pyrite.camera.position);
        }
        else {
        }
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
            this.query.update(camera);
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
        var boundBoxVector = new THREE.Vector3(1, 1, 1);
        
        for (var dl = this.query.DetailLevels.length - 1; dl > 0; dl--) {
            if(dl > Config.maxlod) continue; // skip over processing the detail level if it is great than the max lod
            
            var dl2 = dl - 1;
            var pLevel = this.query.DetailLevels[dl];
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
                if(octIntCubeDict.contains(cubeKey))
                    continue;
                    
                octIntCubeDict.put(cubeKey, octIntCubes[i]);
            }
            
            if(dl2 < Config.maxlod){
                var octIntCubes2 = pLevel.Octree.allIntersections(new THREE.Box3(minVector2, maxVector2));
                // Replace Intersecting Higher Detail Cubes
                for(var i = 0; i < octIntCubes2.length; i++){
                    var pCube = octIntCubes2[i].object;
                    var cubeKey = dl + ',' + pCube.meshName;
                    if(octIntCubeDict.contains(cubeKey)){
                        octIntCubeDict.remove(cubeKey);
                        var cubeW = pLevel.GetWorldCoordinatesForCube(pCube);
                        var cubeL = pLevel2.GetCubeForWorldCoordinates(cubeW).cube;
                        var cubeV = new THREE.Vector3(cubeL.x + 0.5, cubeL.y + 0.5, cubeL.z + 0.5);
                        var minCubeV = new THREE.Vector3().copy(cubeV).sub(boundBoxVector);
                        var maxCubeV = new THREE.Vector3().copy(cubeV).add(boundBoxVector);
                        
                        var q = pLevel2.Octree.allIntersections(new THREE.Box3(minCubeV, maxCubeV));
                        for(var qi = 0; qi < q.length; qi++){
                            var pCube2 = q[qi].object;
                            var cubeKey2 =  dl2 + ',' + pCube2.meshName;        
                            if(octIntCubeDict.contains(cubeKey2))
                                continue;
                            
                            octIntCubeDict.put(cubeKey2, q[qi]);          
                        }
                    }
                }
            }

        }
        
        var _this = this;
        // var cubeCounter = 0;
        // //var octIntlist = new Array(octIntCubeDict.values);
        // if(octIntCubeDict.length() > 0){
        //     octIntCubeDict.iterate(function(k, v){
        //         cubeCounter++;
        //         var intersection = v;
        //         var pCube = intersection.object;
        //         var cubeKey = k;
        //         var detailLevel = pCube.detailLevel.Value - 1;
        //         var pLevel = _this.query.DetailLevels[detailLevel];
        //         var cubePos = pCube.cube.worldCoords;
        //         
        //         if(_this.activeCubes.contains(cubeKey)){
        //             //pCube.init(_this.pyrite.scene, pLevel.Octree, true);
        //             //pCube.load();
        //         }else{
        //             pCube.init(_this.pyrite.scene, pLevel.Octree, true);
        //             pCube.load(function (){});
        //         }
        //     });
        // }
//         if(this.activeCubes.length() > 0){
//             this.activeCubes.iterate(function(k, v){
//                 if(octIntCubeDict.contains(k)){
//                     var pCube = octIntCubeDict.get(k).object;
//                     var detailLevel = pCube.detailLevel.Value - 1;
//                     var pLevel = _this.query.DetailLevels[detailLevel];
//                     octIntCubeDict.remove(k); // remove it from this collection, since we're handling the load here
//                     // don't do anything unless we need to reload the cube
//                     if(!pCube.isLoaded){
// 
//                         pCube.init(_this.pyrite.scene, pLevel.Octree, true);
//                         pCube.load(function (){
//                             //_this.activeCubes.put(k, pCube);
//                         });
//                     }
//                 }
//                 else{
//                     //if()
//                     var pCube = v;
//                     _this.activeCubes.remove(k);
//                     _this.inactiveCubes.put(k, v);
//                     //pCube.unload();
//                 }
//             });
//         }
        if(octIntCubeDict.length() > 0){
            octIntCubeDict.iterate(function(k, v){
                var intersection = v;
                var pCube = intersection.object;
                //var cubeKey = k;
                var detailLevel = pCube.detailLevel.Value - 1;
                var pLevel = _this.query.DetailLevels[detailLevel];
                //var cubePos = pCube.cube.worldCoords;
                if(!pCube.isLoaded){
                    pCube.init(_this.pyrite.scene, pLevel.Octree, false);
                    pCube.load(function (){
                        _this.activeCubes.put(k, pCube);
                    });
                }
            });
        }

    };
    PyriteLoader.prototype.onLoaded = function (dl) {
        //if (dl.Value == Config.lod) {
        //    this.dl = dl;
        //    this.dl.loadCubes();
        //}
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