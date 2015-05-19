var PyriteDetailLevel = (function () {
    function PyriteDetailLevel(scene) {
        this.VisibleCubes = new Array(0);
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
        this.Octree = new THREE.Octree({
            undeferred: false,
            depthMax: Infinity,
            objectsThreshold: 8,
            overlapPct: 0.15,
        });
    }
    PyriteDetailLevel.prototype.update = function (camera) {
        if (!this.arrowHelper) {
        }
        this.Octree.update();
        if (!this.lastCameraPos) {
            this.lastCameraPos = new THREE.Vector3();
            this.searchOctree(camera); // this searches the octree an initial time
        }
        if (this.lastCameraPos.distanceTo(camera.position) > 10) {
            this.searchOctree(camera);
            this.lastCameraPos.set(camera.position.x, camera.position.y, camera.position.z);
        }
        if (this.meshesSearch.length != this.lastSearchCount) {
            this.lastSearchCount = this.meshesSearch.length;
            this.processSearch();
        }
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
            if (found)
                that.cubesToShow.push(cube);
            else
                that.cubesToHide.push(cube);
        }
        // clear the visible cubes list
        if (this.VisibleCubes && this.VisibleCubes.length > 0) {
            for (var k = 0; k < this.VisibleCubes.length; k++) {
                var cube = this.VisibleCubes.pop();
            }
        }
        for (var c = 0; c < that.cubesToShow.length; c++) {
            var cube = that.cubesToShow.pop();
            cube.IsVisible = true;
            cube.showMesh(true);
            that.VisibleCubes.push(cube);
            if (!cube.Meshes || cube.Meshes.length == 0)
                cube.load(that.scene, that.Octree);
        }
        for (var c = 0; c < that.cubesToHide.length; c++) {
            var cube = that.cubesToHide.pop();
            cube.IsVisible = false;
            cube.showMesh(true);
            var index = that.VisibleCubes.indexOf(cube);
        }
    };
    PyriteDetailLevel.prototype.loadCubes = function () {
        var _this = this;
        var cubes = this.Cubes;
        cubes.forEach(function (c) {
            c.load(_this.scene, _this.Octree);
            //this.Octree.add(c, null);
        });
    };
    PyriteDetailLevel.prototype.TextureCoordinatesForCube = function (cubeX, cubeY) {
        var textureXPosition = (cubeX / (this.SetSize.x / this.TextureSetSize.x));
        var textureYPosition = (cubeY / (this.SetSize.y / this.TextureSetSize.y));
        return new THREE.Vector2(Math.floor(textureXPosition), Math.floor(textureYPosition));
    };
    PyriteDetailLevel.prototype.GetWorldCoordinatesForCube = function (cube) {
        var xPos = this.WorldBoundsMin.x + this.WorldCubeScale.x * cube.X + this.WorldCubeScale.x * 0.5;
        var yPos = this.WorldBoundsMin.y + this.WorldCubeScale.y * cube.Y + this.WorldCubeScale.y * 0.5;
        var zPos = this.WorldBoundsMin.z + this.WorldCubeScale.z * cube.Z + this.WorldCubeScale.z * 0.5;
        return new THREE.Vector3(xPos, yPos, zPos);
    };
    return PyriteDetailLevel;
})();
//# sourceMappingURL=pyritedetaillevel.js.map