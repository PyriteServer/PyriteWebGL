class PyriteDetailLevel {
    Name: string;
    Value: number;
    Query: PyriteQuery;
    SetSize: THREE.Vector3;
    TextureSetSize: THREE.Vector2;
    ModelBoundsMin: THREE.Vector3;
    ModelBoundsMax: THREE.Vector3;
    WorldBoundsMax: THREE.Vector3;
    WorldBoundsMin: THREE.Vector3;
    WorldBoundsSize: THREE.Vector3;
    WorldCubeScale: THREE.Vector3;
    DowngradeDistance: number;
    UpgradeDistance: number;
    Cubes: Array<CubeContainer> = new Array<CubeContainer>();
    VisibleCubes: Array<PyriteCube> = new Array(0);
    //Octree: THREE.Octree;
    Octree: Octree = new Octree();
    UseOctree: boolean = false;
    

    private
    meshes = [];
    meshesSearch = [];
    meshCountMax = 1000;
    radius = 500;
    radiusMax = this.radius * 10;
    radiusMaxHalf = this.radiusMax * 0.5;
    radiusSearch = 125; // i'm saying this is equivalent to the distance from the camera
    searchMesh: THREE.Mesh;
    baseR = 255;
    baseG = 0;
    baseB = 255;
    foundR = 0;
    foundG = 255;
    foundB = 0;
    adding = true;
    scene: THREE.Scene;
    rayCaster = new THREE.Raycaster();
    origin = new THREE.Vector3();
    direction = new THREE.Vector3();
    lastCameraPos: THREE.Vector3;
    lastSearchCount: number;
    cubesToShow: Array<PyriteCube> = new Array(0);
    cubesToHide: Array<PyriteCube> = new Array(0);
    arrowHelper: THREE.ArrowHelper;
    threadPool: ThreadPool = new ThreadPool();

    constructor(scene: THREE.Scene) {
        this.scene = scene;

        //this.Octree = new THREE.Octree({
        //    undeferred: false,
        //    depthMax: Infinity,
        //    objectsThreshold: 8,
        //    overlapPct: 0.15,
        //    //scene: this.scene
        //});

    }

    isHighestLod(): boolean {
        return this == this.Query.DetailLevels[0];
    }

    isLowestLod(): boolean {
        var largestIndex = this.Query.DetailLevels.length - 1;
        return this == this.Query.DetailLevels[largestIndex];
    }

    update(camera: THREE.Camera) {
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
        
    }

    processSearch() {
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

            //if (found) that.cubesToShow.push(cube);
            //else that.cubesToHide.push(cube);
        }

        // clear the visible cubes list
        if (this.VisibleCubes && this.VisibleCubes.length > 0) {
            //for (var k = 0; k < this.VisibleCubes.length; k++) {
            //    var cube = this.VisibleCubes.pop();
            //}
        }

        for (var c = 0; c < that.cubesToShow.length; c++) {
            //var cube = that.cubesToShow.pop();
            //cube.IsVisible = true;
            //cube.showMesh(true);
            //that.VisibleCubes.push(cube);
            //if (!cube.Meshes || cube.Meshes.length == 0)
                //cube.load(that.scene, that.Octree);
        }

        for (var c = 0; c < that.cubesToHide.length; c++) {
            //var cube = that.cubesToHide.pop();
            //cube.IsVisible = false;
            //cube.showMesh(true);
            //var index = that.VisibleCubes.indexOf(cube);
            //that.VisibleCubes[index]
        }




    }

    load() {
        var maxboundingboxquery =
            this.WorldBoundsMin.x + "," +
            this.WorldBoundsMin.y + "," +
            this.WorldBoundsMin.z + "/" +
            this.WorldBoundsMax.x + "," +
            this.WorldBoundsMax.y + "," +
            this.WorldBoundsMax.z;

        var cubesUrl = this.Query.versionUrl + "query/" + this.Name + "/" + maxboundingboxquery;
        var that = this;

        $.get(cubesUrl).done((r) => {
            var cubes = r.result;
            //that.Cubes = new Array<PyriteCube>(cubes.length);
            // TODO: implement Octree classes


            for (var i = 0; i < that.Cubes.length; i++) {
                var cube = new PyriteCube(that);
                cube.X = cubes[i][0];
                cube.Y = cubes[i][1];
                cube.Z = cubes[i][2];
                //that.Cubes[i] = cube;
                var min = new THREE.Vector3(cube.X, cube.Y, cube.Z);
                var max = min.add(new THREE.Vector3(1, 1, 1));
                //cube.BoundingBox = new THREE.Box3(min, max);
                this.Octree.add(cube.Mesh);
            }
            //onLoad(dl);
            //this.loader.onLoaded(dl);
        });
    }

    addCube(cube) {
        if (this.cubeExists(cube.x, cube.y, cube.z)) {
            
            return;
        }

        this.Cubes.push(cube);
        this.Octree.add(cube);
    }

    cubeExists(x, y, z) {
        return this.Cubes.some((value, index, values): boolean => {
            return value.cube.x == x && value.cube.y == y && value.cube.z == z;
        });
    }

    showCube(show: boolean, x, y, z) {
        for (var i = 0; i < this.Cubes.length; i++) {
            var cube = this.Cubes[i].cube;

            if (cube.x == x && cube.y == y && cube.z == z) {
                //cube.showMesh(show);
            }
        }
    }

    hideCube(x, y, z) {
        for (var i = 0; i < this.Cubes.length; i++) {
            var cube = this.Cubes[i].cube;

            if (cube.x == x && cube.y == y && cube.z == z) {
                //cube.showMesh(false);
            }
        }
    }

    hideAllCubes() {
        for (var i = 0; i < this.Cubes.length; i++) {
            //this.Cubes[i].showMesh(false);
        }
    }

    removeCube(x, y, z) {
        for (var i = 0; i < this.Cubes.length; i++) {
            var cube = this.Cubes[i].cube;

            if (cube.x == x && cube.y == y && cube.z == z) {
                this.Cubes.splice(i, 1);
            }
            
            //cube.destroy();
            cube = null;
        }
    }

    loadCubes() {
        var initCount = 0;
        var cubes = this.Cubes;
        var that = this;
        cubes.forEach((c) => {
            c.cube.worldCoords = this.GetWorldCoordinatesForCube(c.cube);
            c.init(this.scene);
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
    }

    //loadThread = function (param, done) {
    //    param.load(this.scene, this.Octree)
    //}

    searchOctree = function searchOctree(camera: THREE.Camera) {
      
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

    }


    TextureCoordinatesForCube(cubeX, cubeY): THREE.Vector2 {
        var textureXPosition = (cubeX / (this.SetSize.x / this.TextureSetSize.x));
        var textureYPosition = (cubeY / (this.SetSize.y / this.TextureSetSize.y)); 
        return new THREE.Vector2(Math.floor(textureXPosition), Math.floor(textureYPosition));
    }

    GetWorldCoordinatesForCube(cube: Cube): THREE.Vector3 {
        var xPos = this.WorldBoundsMin.x + this.WorldCubeScale.x * cube.x +
            this.WorldCubeScale.x * 0.5;
        var yPos = this.WorldBoundsMin.y + this.WorldCubeScale.y * cube.y +
            this.WorldCubeScale.y * 0.5;
        var zPos = this.WorldBoundsMin.z + this.WorldCubeScale.z * cube.z +
            this.WorldCubeScale.z * 0.5;
        return new THREE.Vector3(xPos, yPos, zPos);
    }
} 