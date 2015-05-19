//import stats = require("");
var Pyrite = (function () {
    function Pyrite() {
        var _this = this;
        this.meshes = [];
        this.meshesSearch = [];
        this.meshCountMax = 1000;
        this.radius = 500;
        this.radiusMax = this.radius * 10;
        this.radiusMaxHalf = this.radiusMax * 0.5;
        this.radiusSearch = 400;
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
        this.clock = new THREE.Clock();
        this.loadTexture = function loadTexture(path) {
            var texture = new THREE.Texture(this.texture_placeholder);
            var material = new THREE.MeshBasicMaterial({ map: texture, overdraw: 0.5 });
            var image = new Image();
            image.onload = function () {
                texture.image = this;
                texture.needsUpdate = true;
            };
            image.src = path;
            return material;
        };
        this.modifyOctree = function modifyOctree() {
            // if is adding objects to octree
            if (this.adding === true) {
                // create new object
                this.geometry = new THREE.BoxGeometry(50, 50, 50);
                this.material = new THREE.MeshBasicMaterial();
                this.material.color.setRGB(this.baseR, this.baseG, this.baseB);
                this.mesh = new THREE.Mesh(this.geometry, this.material);
                // give new object a random position in radius
                this.mesh.position.set(Math.random() * this.radiusMax - this.radiusMaxHalf, Math.random() * this.radiusMax - this.radiusMaxHalf, Math.random() * this.radiusMax - this.radiusMaxHalf);
                // add new object to octree and scene
                this.octree.add(this.mesh);
                this.scene.add(this.mesh);
                // store object for later
                this.meshes.push(this.mesh);
                // if at max, stop adding
                if (this.meshes.length === this.meshCountMax) {
                    this.adding = false;
                }
            }
            else {
                // get object
                this.mesh = this.meshes.shift();
                // remove from scene and octree
                this.scene.remove(this.mesh);
                this.octree.remove(this.mesh);
                // if no more objects, start adding
                if (this.meshes.length === 0) {
                    this.adding = true;
                }
            }
            /*
        
            // octree details to console
        
            console.log( ' OCTREE: ', octree );
            console.log( ' ... depth ', octree.depth, ' vs depth end?', octree.depth_end() );
            console.log( ' ... num nodes: ', octree.node_count_end() );
            console.log( ' ... total objects: ', octree.object_count_end(), ' vs tree objects length: ', octree.objects.length );
        
            // print full octree structure to console
        
            octree.to_console();
        
            */
        };
        this.searchOctree = function searchOctree() {
            var i, il;
            for (i = 0, il = this.meshesSearch.length; i < il; i++) {
                this.meshesSearch[i].object.material.color.setRGB(this.baseR, this.baseG, this.baseB);
            }
            // new search position
            this.searchMesh.position.set(Math.random() * this.radiusMax - this.radiusMaxHalf, Math.random() * this.radiusMax - this.radiusMaxHalf, Math.random() * this.radiusMax - this.radiusMaxHalf);
            // record start time
            var timeStart = Date.now();
            // search octree from search mesh position with search radius
            // optional third parameter: boolean, if should sort results by object when using faces in octree
            // optional fourth parameter: vector3, direction of search when using ray (assumes radius is distance/far of ray)
            this.origin.copy(this.searchMesh.position);
            this.direction.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
            this.rayCaster.set(this.origin, this.direction);
            this.meshesSearch = this.octree.search(this.rayCaster.ray.origin, this.radiusSearch, true, this.rayCaster.ray.direction);
            var intersections = this.rayCaster.intersectOctreeObjects(this.meshesSearch);
            // record end time
            var timeEnd = Date.now();
            for (i = 0, il = this.meshesSearch.length; i < il; i++) {
                this.meshesSearch[i].object.material.color.setRGB(this.foundR, this.foundG, this.foundB);
            }
            /*
            
            // results to console
            
            console.log( 'OCTREE: ', octree );
            console.log( '... searched ', meshes.length, ' and found ', meshesSearch.length, ' with intersections ', intersections.length, ' and took ', ( timeEnd - timeStart ), ' ms ' );
            
            */
        };
        var container = document.createElement('div');
        document.body.appendChild(container);
        this.loader = new PyriteLoader(this);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
        this.resetCamera();
        this.scene = new THREE.Scene();
        var ambient = new THREE.AmbientLight(0x101030);
        this.scene.add(ambient);
        var directionalLight = new THREE.DirectionalLight(0xffeedd);
        directionalLight.position.set(0, 0, 1);
        this.scene.add(directionalLight);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(0xf0f0f0);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);
        this.controls = new THREE.FlyControls(this.camera);
        this.controls.movementSpeed = 300;
        this.controls.domElement = container;
        this.controls.rollSpeed = Math.PI / 24;
        //this.controls.rollSpeed = 0;
        this.controls.autoForward = false;
        this.controls.dragToLook = true;
        //// skybox
        this.setSkybox();
        this.stats = new Stats();
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.top = '20px';
        this.stats.domElement.style.left = '20px';
        this.stats.domElement.style.zIndex = '100';
        container.appendChild(this.stats.domElement);
        window.addEventListener('resize', function () { return _this.onWindowResize(); }, false);
        var button = document.createElement("button");
        button.name = "cameraresetbutton";
        button.innerText = "Reset Camera";
        button.style.position = 'absolute';
        button.style.top = '100px';
        button.style.left = '20px';
        button.style.zIndex = '100';
        button.addEventListener('click', function () { return _this.resetCamera(); }, false);
        container.appendChild(button);
    }
    Pyrite.prototype.setSkybox = function () {
        //this.texture_placeholder = document.createElement('canvas');
        //this.texture_placeholder.width = 128;
        //this.texture_placeholder.height = 128;
        //var context = this.texture_placeholder.getContext('2d');
        //context.fillStyle = 'rgb( 200, 200, 200 )';
        //context.fillRect(0, 0, this.texture_placeholder.width, this.texture_placeholder.height);
        //var materials = [
        //    this.loadTexture('./textures/skybox/px.jpg'), // right
        //    this.loadTexture('./textures/skybox/nx.jpg'), // left
        //    this.loadTexture('./textures/skybox/py.jpg'), // top
        //    this.loadTexture('./textures/skybox/ny.jpg'), // bottom
        //    this.loadTexture('./textures/skybox/pz.jpg'), // back
        //    this.loadTexture('./textures/skybox/nz.jpg')  // front
        //];
        //this.skyboxmesh = new THREE.Mesh(new THREE.BoxGeometry(5000, 5000, 5000, 7, 7, 7), new THREE.MeshFaceMaterial(materials));
        //this.skyboxmesh.scale.x = - 1;
        //this.scene.add(this.skyboxmesh);
        var sky = new THREE.Sky();
        this.scene.add(sky.mesh);
    };
    Pyrite.prototype.resetCamera = function () {
        this.camera.position.set(0, 0, -300);
        this.camera.rotation.set(THREE.Math.degToRad(45), THREE.Math.degToRad(90), THREE.Math.degToRad(45));
    };
    Pyrite.prototype.onWindowResize = function () {
        var _this = this;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        requestAnimationFrame(function () { return _this.render(); });
    };
    Pyrite.prototype.animate = function () {
        var _this = this;
        requestAnimationFrame(function () { return _this.animate(); });
        //this.modifyOctree();
        //this.searchOctree();
        var delta = this.clock.getDelta();
        this.controls.update(delta);
        this.render();
        this.loader.update(this.camera);
        this.stats.update();
    };
    Pyrite.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };
    Pyrite.prototype.start = function () {
        var _this = this;
        console.log("starting");
        this.loader.load();
        requestAnimationFrame(function () { return _this.animate(); });
    };
    Pyrite.prototype.stop = function () {
        clearTimeout(this.timerToken);
    };
    return Pyrite;
})();
window.onload = function () {
    var pyrite = new Pyrite();
    pyrite.start();
};
//# sourceMappingURL=pyrite.js.map