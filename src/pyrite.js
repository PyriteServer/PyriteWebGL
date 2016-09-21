/* eslint no-unused-vars: ["off"]*/
/* eslint comma-dangle: ["error", "only-multiline"]*/
/* global window:false, document:false requestAnimationFrame:false cancelAnimationFrame: false */

import * as THREE from 'three';
import UTMLatLng from 'utm-latlng';
import Config from './config.js';
import PyriteLoader from './loader.js';
import FlyControls from './FlyControls.js';
import CTMLoader from './ctm/CTMLoader.js';
import PyriteException from './pyriteexception.js';

require('./skyShader.js');

class Pyrite {
  constructor(container, set, modelConfig, lod, maxlod, debug) {
    if (!container) {
      throw new PyriteException('container must be specified', 'Pyrite');
    }

    console.log(container);
    console.log(`${container.clientHeight} ${container.clientWidth}`);

    this.animationStops = [];
    this.previousAnimationStops = [];

    this.modelConfig = modelConfig || {};

    this.container = container;
    this.clock = new THREE.Clock();
    this.cameraRig = new THREE.Object3D();
    this.cameraRigDummy = new THREE.Object3D();
    this.cameraPos = new THREE.Vector3();
    this.cameraRot = new THREE.Euler();

    this.config = new Config();

    this.config.lod = parseInt(lod, 10) || this.config.lod;
    this.config.maxlod = parseInt(maxlod, 10) || this.config.maxlod;
    this.config.set = set || this.config.set;
    this.config.version = this.modelConfig.version || this.config.version;
    this.config.fmt = 'ctm';
    this.config.debug = parseInt(debug, 10) || this.config.debug;

    this.cubeDetectorGroup = new THREE.Object3D();
    this.modelMeshGroup = new THREE.Object3D();

    this.loader = new PyriteLoader(this, this.config);
    this.loader.handleInitialCubesLoaded = this.handleInitialCubesLoaded.bind(this);
    this.loader.isUpgradingEnabled = this.isUpgradingEnabled.bind(this);
    this.camera = new THREE.PerspectiveCamera(50, this.container.clientWidth / this.container.clientHeight, 1, 9000);
    this.camera.updateProjectionMatrix();
    this.cameraRig.add(this.camera);
    this.resetCamera();

    this.scene = new THREE.Scene();
    this.uiScene = new THREE.Scene();

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
    directionalLight.position.set(0, 1, 0);
    this.scene.add(directionalLight);
    this.scene.add(ambient);
    this.uiScene.add(this.cameraRig);

    const uiAmbient = new THREE.AmbientLight(0xffffff, 0.8);
    const uiDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
    directionalLight.position.set(0, 1, 0);
    this.uiScene.add(uiAmbient);
    this.uiScene.add(uiDirectionalLight);

    this.up = new THREE.Vector3(0, 1, 0);
    this.manualLookTargetPosition = new THREE.Vector3();

    this.scene.add(this.cubeDetectorGroup);
    this.scene.add(this.modelMeshGroup);

    const utm = new UTMLatLng();

    this.started = false;

    const ctmloader = new CTMLoader();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.autoClear = false;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.controls = new FlyControls(this.cameraRig);
    this.controls.movementSpeed = 20.0;
    this.controls.rollSpeed = (Math.PI / 24) * 2;

    this.mousePosition = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    this.controls.autoForward = false;
    this.controls.dragToLook = true;

    // // skybox
    this.initSky();

    this.debugStats = false;

    if (this.debugStats) {
      this.statsContainer = document.createElement('div');
      this.statsContainer.style.position = 'absolute';
      this.statsContainer.style.width = 100;
      this.statsContainer.style.height = 100;
      this.statsContainer.style.backgroundColor = 'blue';
      this.statsContainer.style.top = '20px';
      this.statsContainer.style.left = '20px';
      document.body.appendChild(this.statsContainer);
    }

    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize, false);

    this.nextAnimationRequestId = null;

    this.lookTarget = null;

    this.animate = this.animate.bind(this);
  }

  initSky() {
    // Add Sky Mesh
    const sky = new THREE.Sky();
    this.scene.add(sky.mesh);

    // Add Sun Helper
    const sunSphere = new THREE.Mesh(
      new THREE.SphereBufferGeometry(20000, 16, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    sunSphere.position.y = -700000;
    sunSphere.visible = false;
    this.scene.add(sunSphere);

    // / GUI

    const effectController = {
      turbidity: 1,
      reileigh: 0.3,
      mieCoefficient: 0.0054,
      mieDirectionalG: 0.38,
      luminance: 1,
      inclination: 0.47, // elevation / inclination
      azimuth: 0.26, // Facing front,
      sun: !true,
    };

    const distance = 400000;

    const uniforms = sky.uniforms;
    uniforms.turbidity.value = effectController.turbidity;
    uniforms.reileigh.value = effectController.reileigh;
    uniforms.luminance.value = effectController.luminance;
    uniforms.mieCoefficient.value = effectController.mieCoefficient;
    uniforms.mieDirectionalG.value = effectController.mieDirectionalG;

    const theta = Math.PI * (effectController.inclination - 0.5);
    const phi = 2 * Math.PI * (effectController.azimuth - 0.5);

    sunSphere.position.x = distance * Math.cos(phi);
    sunSphere.position.y = distance * Math.sin(phi) * Math.sin(theta);
    sunSphere.position.z = distance * Math.sin(phi) * Math.cos(theta);

    sunSphere.visible = effectController.sun;

    sky.uniforms.sunPosition.value.copy(sunSphere.position);
  }

  setCamera(positon, euler, lookAt) {
    this.cameraPos = positon;
    this.cameraRot = euler;
    this.cameraRig.position.set(positon.x, positon.y, positon.z);
    this.camera.rotation.set(euler.x, euler.y, euler.z, euler.order);
  }

  resetCamera() {
    this.cameraRig.position.set(this.cameraPos.x, this.cameraPos.y + 700, this.cameraPos.z);
    this.camera.rotation.set(
      this.cameraRot.x,
      this.cameraRot.y,
      this.cameraRot.z,
      this.cameraRot.order
    );
  }

  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    this.nextAnimationRequestId = requestAnimationFrame(this.animate);
  }

  isUpgradingEnabled() {
    return this.controls.moveVector.length() === 0 &&
      this.controls.rotationVector.length() === 0;
  }

  animate(time) {
    if (!this.clock) {
      return;
    }
    this.nextAnimationRequestId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    let distanceToLookAtTarget = null;
    if (this.lookTarget) {
      distanceToLookAtTarget = this.cameraRig.position.distanceTo(this.lookTarget.position);
    }

    this.controls.update(delta);
    if (distanceToLookAtTarget) {
      this.camera.getWorldDirection(this.manualLookTargetPosition);
      this.manualLookTargetPosition.setLength(distanceToLookAtTarget);
      this.manualLookTargetPosition.add(this.cameraRig.position);
    }

    this.update();

    // this MUST be the last call of animate
    this.render();
  }

  update() {
    this.loader.update(this.cameraRig);
  }

  render() {
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.clearDepth();
    this.renderer.render(this.uiScene, this.camera);
  }

  start() {
    this.started = true;
    this.startTime = Date.now();
    this.loader.load(this.cameraRig, this.handleLoadCompleted.bind(this));
    this.nextAnimationRequestId = requestAnimationFrame(this.animate);
  }

  handleLoadCompleted() {
    // TODO: Put camera somewhere the model can be seen
  }

  getNewRotationXY(position) {
    this.cameraRigDummy.position.copy(this.cameraRig.position);
    this.cameraRigDummy.rotation.copy(this.cameraRig.rotation);

    this.cameraRigDummy.up = this.up;
    this.cameraRigDummy.rotation.order = 'YXZ';
    this.cameraRigDummy.lookAt(position);


    return {
      x: this.cameraRigDummy.rotation.x * -1,
      y: this.cameraRigDummy.rotation.y + THREE.Math.degToRad(180),
    };
  }

  cameraRigLookAt(position) {
    if (!this.lookTarget) {
      this.lookTarget = new THREE.Object3D();
    }
    this.lookTarget.position.copy(position);

    const { x, y } = this.getNewRotationXY(position);

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.x = x;
    this.camera.rotation.y = 0;
    this.camera.rotation.z = 0;

    this.cameraRig.rotation.x = 0;
    this.cameraRig.rotation.z = 0;
    this.cameraRig.rotation.y = y;
  }

  handleInitialCubesLoaded() {
    console.log(`InitialLoad Time ${Date.now() - this.startTime}`);
    if (this.lastNavigationTarget) {
      this.moveCameraToHole(this.lastNavigationTarget);
      delete this.lastNavigationTarget;
    }
  }

  moveCameraToDefaultPosition() {
    if (this.modelConfig && this.modelConfig.defaultCameraSettings) {
      const cameraSettings = this.modelConfig.defaultCameraSettings;
      const rigPosition = cameraSettings.rigPosition;
      const rigRotation = cameraSettings.rigRotation;
      const cameraRotation = cameraSettings.cameraRotation;
      if (!this.lookTarget) {
        this.lookTarget = new THREE.Object3D();
      }

      if (cameraSettings.lookTarget) {
        this.lookTarget.position.copy(cameraSettings.lookTarget);
      }

      this.cameraRig.position.set(rigPosition.x, rigPosition.y, rigPosition.z);
      this.cameraRig.rotation.order = rigRotation.order;
      this.cameraRig.rotation.x = rigRotation.x;
      this.cameraRig.rotation.y = rigRotation.y;
      this.cameraRig.rotation.z = rigRotation.z;

      this.camera.rotation.order = cameraRotation.order;
      this.camera.rotation.x = cameraRotation.x;
      this.camera.rotation.y = cameraRotation.y;
      this.camera.rotation.z = cameraRotation.z;
    }
  }

  stop() {
    clearTimeout(this.timerToken);
  }

  shutdown() {
    // Probably need to dispose of everything Three js related
    // TODO: Validate the following
    // https://stackoverflow.com/questions/21453309/how-can-i-destroy-threejs-scene
    cancelAnimationFrame(this.nextAnimationRequestId);

    this.controls.dispose();
    delete this.controls;

    // this.cleanSkybox();

    this.loader.unload();
    this.scene.remove(this.cubeDetectorGroup);
    this.scene.remove(this.modelMeshGroup);
    delete this.loader.handleInitialCubesLoaded;
    delete this.loader.isUpgradingEnabled;
    delete this.loader;
    delete this.scene;
    delete this.uiScene;
    delete this.camera;
    delete this.cameraRig;
    delete this.cameraRigDummy;
    delete this.renderer;
    delete this.controls;
    delete this.cubeDetectorGroup;
    delete this.modelMeshGroup;

    delete this.lookTarget;

    window.removeEventListener('resize', this.onWindowResize, false);
    while (this.container.lastChild) { this.container.removeChild(this.container.lastChild); }

    if (this.debugStats) {
      document.body.removeChild(this.statsContainer);
    }

    this.clock.stop();
    delete this.clock;
  }
}

export default Pyrite;
