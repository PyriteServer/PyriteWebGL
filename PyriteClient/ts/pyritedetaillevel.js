var PyriteDetailLevel = (function () {
    function PyriteDetailLevel(scene) {
        this.meshes = [];
        this.meshesSearch = [];
        this.meshCountMax = 1000;
        this.radius = 500;
        this.radiusMax = this.radius * 10;
        this.radiusMaxHalf = this.radiusMax * 0.5;
        this.radiusSearch = 500;
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
        this.searchOctree = function searchOctree(camera) {
            var i, il;
            for (i = 0, il = this.meshesSearch.length; i < il; i++) {
                //this.meshesSearch[i].object.material.color.setRGB(this.baseR, this.baseG, this.baseB);
                this.meshesSearch[i].object.visible = false;
            }
            // new search position
            //this.searchMesh.position.set(
            //    Math.random() * this.radiusMax - this.radiusMaxHalf,
            //    Math.random() * this.radiusMax - this.radiusMaxHalf,
            //    Math.random() * this.radiusMax - this.radiusMaxHalf
            //    );
            // record start time
            var timeStart = Date.now();
            // search octree from search mesh position with search radius
            // optional third parameter: boolean, if should sort results by object when using faces in octree
            // optional fourth parameter: vector3, direction of search when using ray (assumes radius is distance/far of ray)
            //this.origin.copy(this.searchMesh.position);
            this.origin.copy(camera.position);
            //this.direction.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
            this.direction = new THREE.Vector3(0, 0, -1);
            this.direction.applyQuaternion(camera.quaternion);
            this.rayCaster.set(this.origin, this.direction);
            this.meshesSearch = this.Octree.search(this.rayCaster.ray.origin, this.radiusSearch, true, this.rayCaster.ray.direction);
            var intersections = this.rayCaster.intersectOctreeObjects(this.meshesSearch);
            // record end time
            var timeEnd = Date.now();
            for (i = 0, il = this.meshesSearch.length; i < il; i++) {
                //this.meshesSearch[i].object.material.color.setRGB(this.foundR, this.foundG, this.foundB);
                this.meshesSearch[i].object.visible = true;
            }
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
            scene: this.scene
        });
    }
    PyriteDetailLevel.prototype.update = function (camera) {
        if (this.Octree.nodeCount > 1) {
            this.searchOctree(camera);
            this.Octree.update();
        }
    };
    PyriteDetailLevel.prototype.loadVisibleCubes = function (scene) {
    };
    PyriteDetailLevel.prototype.loadCubes = function () {
        var _this = this;
        var cubes = this.Cubes;
        cubes.forEach(function (c) {
            c.load(_this.scene, _this.Octree);
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