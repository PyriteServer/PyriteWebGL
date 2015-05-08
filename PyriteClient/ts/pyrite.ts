//import stats = require("");

class Pyrite {
    ///<reference path="definitions/threejs/three.d.ts"/>
    ///<reference path="definitions/threejs/three-orbitcontrols.d.ts"/>
    ///<reference path="stats.d.ts"/>

    timerToken: number;
    canvas: HTMLCanvasElement;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    cube: THREE.Mesh;
    controls: THREE.OrbitControls;
    stats: Stats;
    loader: PyriteLoader;
    octree: THREE.Octree;
    dl: PyriteDetailLevel;

    private
    meshes = [];
	meshesSearch = [];
    meshCountMax = 1000;
    radius = 500;
    radiusMax = this.radius * 10;
    radiusMaxHalf = this.radiusMax * 0.5;
    radiusSearch = 400;
    searchMesh: THREE.Mesh;
    baseR = 255;
    baseG = 0; 
    baseB = 255;
    foundR = 0;
    foundG = 255; 
    foundB = 0;
    adding = true;
    rayCaster = new THREE.Raycaster();
    origin = new THREE.Vector3();
    direction = new THREE.Vector3();
    texture_placeholder;
    skyboxmesh: THREE.Mesh;

    constructor() {
        this.loader = new PyriteLoader(this);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.z = 30;
        this.controls = new THREE.OrbitControls(this.camera);
        //this.controls.damping = 0.2;
        var that = this;
        this.controls.addEventListener('change', function () {
            that.renderer.render(that.scene, that.camera);
        });
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
        document.body.appendChild(this.renderer.domElement);

        //// skybox
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

        this.stats = new Stats();
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.top = '0px';
        this.stats.domElement.style.zIndex = '100';
        document.body.appendChild(this.stats.domElement);

        //this.octree = new THREE.Octree({
        //    undeferred: false,
        //    depthMax: Infinity,
        //    objectsThreshold: 8,
        //    overlapPct: 0.15,
        //    scene: this.scene
        //});

        //this.searchMesh = new THREE.Mesh(
        //    new THREE.SphereGeometry(this.radiusSearch),
        //    new THREE.MeshBasicMaterial({ color: 0x00FF00, transparent: true, opacity: 0.4 })
        //    );
        //this.scene.add(this.searchMesh);

        window.addEventListener('resize', () => this.onWindowResize, false);
    }

    loadTexture = function loadTexture(path) {
        var texture = new THREE.Texture(this.texture_placeholder);
        var material = new THREE.MeshBasicMaterial({ map: texture, overdraw: 0.5 });
        var image = new Image();
        image.onload = function () {
            texture.image = this;
            texture.needsUpdate = true;
        };
        image.src = path;
        return material;
    }

    onWindowResize() {

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);

        requestAnimationFrame(() => this.render());
    }

    render() {
        requestAnimationFrame(() => this.render());

        //this.modifyOctree();

        //this.searchOctree();
        
        this.renderer.render(this.scene, this.camera);

        //this.octree.update();
        if(this.dl) this.dl.Octree.update();

        this.stats.update();
    }

    start() {
        console.log("starting");

        this.loader.load();
        requestAnimationFrame(() => this.render());
    }

    stop() {
        clearTimeout(this.timerToken);
    }

    modifyOctree = function modifyOctree() {
			
        // if is adding objects to octree
			
        if (this.adding === true) {
				
            // create new object
				
            this.geometry = new THREE.BoxGeometry(50, 50, 50);
            this.material = new THREE.MeshBasicMaterial();
            this.material.color.setRGB(this.baseR, this.baseG, this.baseB);

            this.mesh = new THREE.Mesh(this.geometry, this.material);
				
            // give new object a random position in radius
				
            this.mesh.position.set(
                Math.random() * this.radiusMax - this.radiusMaxHalf,
                Math.random() * this.radiusMax - this.radiusMaxHalf,
                Math.random() * this.radiusMax - this.radiusMaxHalf
                );
				
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
        // else remove objects from octree
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

    }

    searchOctree = function searchOctree() {

				var i, il;
			
				// revert previous search objects to base color
			
				for (i = 0, il = this.meshesSearch.length; i < il; i++) {

                    this.meshesSearch[i].object.material.color.setRGB(this.baseR, this.baseG, this.baseB);

				}
			
				// new search position
                this.searchMesh.position.set(
                    Math.random() * this.radiusMax - this.radiusMaxHalf,
                    Math.random() * this.radiusMax - this.radiusMaxHalf,
                    Math.random() * this.radiusMax - this.radiusMaxHalf
        );
			
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
			
				// set color of all meshes found in search
			
                for (i = 0, il = this.meshesSearch.length; i < il; i++) {

                    this.meshesSearch[i].object.material.color.setRGB(this.foundR, this.foundG, this.foundB);

				}
			
    /*
	
    // results to console
	
    console.log( 'OCTREE: ', octree );
    console.log( '... searched ', meshes.length, ' and found ', meshesSearch.length, ' with intersections ', intersections.length, ' and took ', ( timeEnd - timeStart ), ' ms ' );
	
    */

}
		
}

window.onload = () => {
    var pyrite = new Pyrite();
    pyrite.start();
};