var Pyrite = (function () {
    function Pyrite() {
        var _this = this;
        this.clock = new THREE.Clock();
        this.cameraRig = new THREE.Object3D();
        this.cameraPos = new THREE.Vector3();
        this.cameraRot = new THREE.Euler();
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
        var queries = {};
        $.each(document.location.search.substr(1).split('&'), function (c, q) {
            var i = q.split('=');
            if (i[0]) {
                queries[i[0].toString()] = i[1].toString();
            }
        });

        if (queries['lod']) {
            Config.lod = parseInt(queries['lod']);
        }

        if (queries['maxlod']) {
            Config.maxlod = parseInt(queries['maxlod']);
        }

        if (queries['set']) {
            Config.set = queries['set'];
        }

        if (queries['version']) {
            Config.version = queries['version'];
        }

        if (queries['fmt']) {
            Config.fmt = queries['fmt'];
        }

        if (queries['debug']) {
            Config.debug = parseInt(queries['debug']);
        }

        if (queries['showcubes']) {
            Config.showcubes = parseInt(queries['showcubes']);
        }

        var container = document.getElementById('container');
        //document.body.appendChild(container);

        this.loader = new PyriteLoader(this);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
        this.cameraRig.add(this.camera);
        this.resetCamera();

        this.scene = new THREE.Scene();
        var ambient = new THREE.AmbientLight(0x101030);
        this.scene.add(ambient);
        this.scene.add(this.cameraRig);
        var directionalLight = new THREE.DirectionalLight(0xffeedd);
        directionalLight.position.set(0, 0, 1);
        this.scene.add(directionalLight);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(0xf0f0f0);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);

        this.controls = new THREE.FlyControls(this.cameraRig);
        this.controls.movementSpeed = 100;
        this.controls.domElement = container;
        this.controls.rollSpeed = Math.PI / 24;

        //this.controls.rollSpeed = 0;
        this.controls.autoForward = false;
        this.controls.dragToLook = true;

        // var orbitControls = new THREE.OrbitControls(this.cameraRig, container);
        // this.controls = orbitControls;

        //// skybox
        //this.setSkybox();

        this.stats = new Stats();
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.top = '20px';
        this.stats.domElement.style.left = '20px';
        this.stats.domElement.style.zIndex = '100';
        container.appendChild(this.stats.domElement);

        window.addEventListener('resize', function () {
            return _this.onWindowResize();
        }, false);

        this.addControls(container);

        // var axisHelper = new THREE.AxisHelper( 50 );
        // this.scene.add( axisHelper );
    }
    Pyrite.prototype.addControls = function(container) {
        var _this = this;
        var button = document.createElement("button");
        button.name = "cameraresetbutton";
        button.innerText = "Reset Camera";
        button.style.position = 'absolute';
        button.style.top = '100px';
        button.style.left = '20px';
        button.style.zIndex = '100';
        button.addEventListener('click', function () {
            return _this.resetCamera();
        }, false);
        container.appendChild(button);

        //var controlmap = document.createElement('table');

    };
    Pyrite.prototype.setSkybox = function () {
        this.texture_placeholder = document.createElement('canvas');
        this.texture_placeholder.width = 128;
        this.texture_placeholder.height = 128;
        var context = this.texture_placeholder.getContext('2d');
        context.fillStyle = 'rgb( 200, 200, 200 )';
        context.fillRect(0, 0, this.texture_placeholder.width, this.texture_placeholder.height);
        var materials = [
           this.loadTexture('./textures/skybox/px.jpg'), // right
           this.loadTexture('./textures/skybox/nx.jpg'), // left
           this.loadTexture('./textures/skybox/py.jpg'), // top
           this.loadTexture('./textures/skybox/ny.jpg'), // bottom
           this.loadTexture('./textures/skybox/pz.jpg'), // back
           this.loadTexture('./textures/skybox/nz.jpg')  // front
        ];
        this.skyboxmesh = new THREE.Mesh(new THREE.BoxGeometry(3000, 3000, 3000, 7, 7, 7), new THREE.MeshFaceMaterial(materials));
        this.skyboxmesh.scale.x = - 1;
        this.scene.add(this.skyboxmesh);
        // var sky = new THREE.Sky();
        // this.scene.add(sky.mesh);
    };
    Pyrite.prototype.loadtexture = function ( path ) {
				var texture = new THREE.Texture( texture_placeholder );
				var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5 } );
				var image = new Image();
				image.onload = function () {
					texture.image = this;
					texture.needsUpdate = true;
				};
				image.src = path;
				return material;
			}
    Pyrite.prototype.setCamera = function (positon, euler, lookAt) {
        this.cameraPos = positon;
        this.cameraRot = euler;
        this.cameraRig.position.set(positon.x, positon.y, positon.z);
        this.camera.rotation.set(euler.x, euler.y, euler.z, euler.order);

        // if(lookAt !== 'undefined')
        //     this.camera.lookAt(lookAt);
    };

    Pyrite.prototype.resetCamera = function () {
        this.cameraRig.position.set(this.cameraPos.x, this.cameraPos.y, this.cameraPos.z);
        this.camera.rotation.set(this.cameraRot.x, this.cameraRot.y, this.cameraRot.z, this.cameraRot.order);
        //this.camera.rotation.set(THREE.Math.degToRad(45), THREE.Math.degToRad(90), THREE.Math.degToRad(45));
    };

    Pyrite.prototype.onWindowResize = function () {
        var _this = this;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);

        requestAnimationFrame(function () {
            return _this.render();
        });
    };

    Pyrite.prototype.animate = function () {
        var _this = this;
        requestAnimationFrame(function () {
            return _this.animate();
        });
        var delta = this.clock.getDelta();
        this.controls.update(delta);
        this.render();
        this.update();
        this.stats.update();
    };

    Pyrite.prototype.update = function () {
        //this.skyboxmesh.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
        this.loader.update(this.cameraRig);
        var movespeedText = document.getElementById('movespeed');
        movespeedText.innerText = this.controls.movementSpeed;
    };

    Pyrite.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };

    Pyrite.prototype.start = function () {
        var _this = this;
        this.loader.load(this.cameraRig);
        requestAnimationFrame(function () {
            return _this.animate();
        });
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
