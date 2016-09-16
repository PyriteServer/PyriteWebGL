/* eslint no-unused-vars: ["off"]*/
/* eslint comma-dangle: ["error", "only-multiline"]*/
/* global window:false, document:false requestAnimationFrame:false cancelAnimationFrame: false */

import THREE from 'three';
import TWEEN from 'tween.js';
import UTMLatLng from 'utm-latlng';
import Config from './config.js';
import PyriteLoader from './loader.js';
import FlyControls from './FlyControls.js';
import CTMLoader from './ctm/CTMLoader.js';

require('./skyShader.js');

class Pyrite {
  constructor(container, set, modelConfig, lod, maxlod, debug, holes, startHole) {
    this.animationStops = [];
    this.previousAnimationStops = [];
    this.startHole = startHole;
    this.modelConfig = modelConfig || {
      version: 'V3',
      utmOffset: {
        x: 0,
        y: 0,
        z: 0,
      },
    };

    this.container = container;
    this.clock = new THREE.Clock();
    this.cameraRig = new THREE.Object3D();
    this.cameraRigDummy = new THREE.Object3D();
    this.cameraPos = new THREE.Vector3();
    this.cameraRot = new THREE.Euler();

    this.config = new Config();

    this.config.lod = parseInt(lod, 10);
    this.config.maxlod = parseInt(maxlod, 10);
    this.config.set = set;
    this.config.version = this.modelConfig.version;
    this.config.fmt = 'ctm';
    this.config.debug = parseInt(debug, 10);

    this.cubeDetectorGroup = new THREE.Object3D();
    this.modelMeshGroup = new THREE.Object3D();

    this.loader = new PyriteLoader(this, this.config);
    this.loader.handleInitialCubesLoaded = this.handleInitialCubesLoaded.bind(this);
    this.loader.isUpgradingEnabled = this.isUpgradingEnabled.bind(this);
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 9000);
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

    this.chevron = new THREE.Object3D();
    const chevronShape = new THREE.Shape();
    chevronShape.moveTo(80, 20);
    chevronShape.moveTo(40, 60);
    chevronShape.lineTo(40, 80);
    chevronShape.lineTo(80, 40);
    chevronShape.lineTo(120, 80);
    chevronShape.lineTo(120, 60);
    chevronShape.lineTo(80, 20);

    const extrudeSettings = {
      amount: 8,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 2,
      bevelSize: 1,
      bevelThickness: 1,
    };

    const chevronGeometry = new THREE.ExtrudeGeometry(chevronShape, extrudeSettings);
    chevronGeometry.center();
    chevronGeometry.rotateX(-Math.PI / 2);
    const chevronMesh = new THREE.Mesh(
      chevronGeometry,
      new THREE.MeshLambertMaterial({ color: 0xeeeeee })
    );
    chevronMesh.scale.set(0.05, 0.05, 0.05);
    this.chevron.add(chevronMesh);
    this.chevron.position.set(0, 0, 0);

    this.up = new THREE.Vector3(0, 1, 0);
    this.manualLookTargetPosition = new THREE.Vector3();

    this.uiScene.add(this.chevron);
    this.nextChevron = new THREE.Object3D();
    this.nextChevron.disabled = true;
    this.nextChevron.up = this.up;
    this.nextChevron.rotation.order = 'YXZ';
    const nextChevronMesh = new THREE.Mesh(
      chevronGeometry,
      new THREE.MeshLambertMaterial({ color: 0xeeeeee })
    );
    nextChevronMesh.scale.set(0.04, 0.04, 0.04);
    nextChevronMesh.name = 'nextChevron';

    this.staticChevronsEnabled = false;

    this.prevChevron = new THREE.Object3D();
    this.prevChevron.disabled = true;
    const prevChevronMesh = new THREE.Mesh(
      chevronGeometry,
      new THREE.MeshLambertMaterial({ color: 0xeeeeee })
    );
    prevChevronMesh.scale.set(0.04, 0.04, 0.04);
    prevChevronMesh.name = 'prevChevron';
    this.nextChevron.add(nextChevronMesh);
    this.prevChevron.add(prevChevronMesh);


    this.nextChevron.position.set(2.5, -10, -35);
    this.prevChevron.position.set(-2.5, -10, -35);

    this.scene.add(this.cubeDetectorGroup);
    this.scene.add(this.modelMeshGroup);

    const utm = new UTMLatLng();

    this.started = false;
    this.markersLoaded = false;

    const ctmloader = new THREE.CTMLoader();

    ctmloader.load('http://projectgreen.azureedge.net/skybox/marker_clubs_normals.ctm',
      (markerGeometry) => {
        this.markerGeometry = markerGeometry;
        this.markerGeometry.scale(3.25, 3.25, 3.25);
        this.markerGeometry.center();
        this.markerGeometry.translate(0, -this.markerGeometry.boundingBox.min.y, 0);

        this.markerMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 1,
        });
        this.holesAndTees = [];
        if (holes) {
          this.holes = holes;
          holes.forEach((hole) => {
            let { Easting, Northing } = utm.convertLatLngToUtm(
              hole.GreenLocation.coordinates[1],
              hole.GreenLocation.coordinates[0]
            );
            const holeMarker = new THREE.Mesh(this.markerGeometry, this.markerMaterial);
            holeMarker.position.set(
              Easting - this.modelConfig.utmOffset.x,
              500,
              (Northing - this.modelConfig.utmOffset.z) * -1
            );
            hole.marker = holeMarker;
            this.scene.add(holeMarker);

            if (hole.tees && hole.tees[0] && hole.tees[0].Location) {
              const tee = hole.tees[0];

              ({ Easting, Northing } = utm.convertLatLngToUtm(
                tee.Location.coordinates[1],
                tee.Location.coordinates[0]
              ));

              const teeMarker = new THREE.Object3D();
              teeMarker.position.set(
                Easting - this.modelConfig.utmOffset.x,
                500,
                (Northing - this.modelConfig.utmOffset.z) * -1
              );
              tee.marker = teeMarker;
              this.scene.add(teeMarker);
              this.holesAndTees.push(tee);

              // console.log(`Hole: ${hole.HoleId} Tee: ${tee.TeeId}`);
            }
            this.holesAndTees.push(hole);
          });
        }

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.autoClear = false;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);

        this.controls = new FlyControls(this.cameraRig);
        this.controls.handleClick = this.handleClick.bind(this);
        this.controls.handleMouseMove = this.handleMouseMove.bind(this);
        this.controls.movementSpeed = 0;
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

        this.markersLoaded = true;
        if (this.started) {
          this.start();
        }
      });
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
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.nextAnimationRequestId = requestAnimationFrame(this.animate);
  }

  isUpgradingEnabled() {
    return TWEEN.getAll().length === 0 &&
      this.controls.moveVector.length() === 0 &&
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
    if (TWEEN.getAll().length === 0) {
      this.controls.update(delta);
      if (distanceToLookAtTarget) {
        this.camera.getWorldDirection(this.manualLookTargetPosition);
        this.manualLookTargetPosition.setLength(distanceToLookAtTarget);
        this.manualLookTargetPosition.add(this.cameraRig.position);
      }
    }
    TWEEN.update(time);

    if (this.holesAndTees) {
      this.holesAndTees.forEach((holeOrTee) => {
        holeOrTee.marker.lookAt(this.cameraRig.position);
      });
    }

    this.update();

    if (this.controls.mouseStatus || this.controls.touchStatus || TWEEN.getAll().length > 0) {
      if (!this.chevron.disabled) {
        this.uiScene.remove(this.chevron);
        this.chevron.disabled = true;
      }
    } else if (this.chevron.disabled) {
      this.uiScene.add(this.chevron);
      this.chevron.disabled = false;
    }
    if (this.currentHole) {
      this.chevronLookAt(this.nextChevron, this.currentHole.marker.position);
      this.chevronLookAt(this.prevChevron, this.currentHole.tees[0].marker.position);
    }

    if (!this.lastChevronUpdateTime || (time - this.lastChevronUpdateTime > 200)) {
      this.lastChevronUpdateTime = time;
      this.updateChevronPosition(this.mousePosition);
    }
    this.render();
  }

  chevronLookAt(chevron, lookAtTarget) {
    this.cameraRigDummy.position.copy(this.cameraRig.position);
    this.cameraRigDummy.rotation.copy(this.cameraRig.rotation);
    this.cameraRigDummy.lookAt(lookAtTarget);
    chevron.rotation.copy(this.cameraRigDummy.rotation);
    chevron.rotation.x -= this.cameraRig.rotation.x - this.camera.rotation.x;
    chevron.rotation.y -= this.cameraRig.rotation.y;
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
    if (this.markersLoaded) {
      this.startTime = Date.now();
      this.loader.load(this.cameraRig, this.holesAndTees, this.handleLoadCompleted.bind(this));
      this.nextAnimationRequestId = requestAnimationFrame(this.animate);
    }
  }

  handleLoadCompleted() {
    if (this.startHole) {
      this.moveCameraToHole(this.startHole);
    } else {
      this.moveCameraToDefaultPosition();
    }
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

  getTweenForAnimationStop(animationStop) {
    let tween = null;
    const newTween = null;
    switch (animationStop.type) {
      case 'pause':
        tween = new TWEEN.Tween();
        tween.delay(this.tweenLengthInMs / 2);
        break;
      case 'position':
        tween = new TWEEN.Tween(this.cameraRig.position)
          .to(animationStop.value, this.tweenLengthInMs)
          .easing(TWEEN.Easing.Linear.None)
          .onUpdate(() => { this.cameraRigLookAt(this.lookTarget.position); });
        break;
      case 'looktargetposition':
        tween = new TWEEN.Tween(this.lookTarget.position)
          .to(animationStop.value, this.tweenLengthInMs)
          .easing(TWEEN.Easing.Linear.None)
          .onUpdate(() => {
            this.cameraRigLookAt(this.lookTarget.position);
          });
        break;
      default: break;
    }

    return tween;
  }

  runAnimationTillPause() {
    let rootTween = null;
    let lastTween = null;
    const repositionTween = null;
    let lastPositionStop = null;
    if (this.animationStops && this.animationStops.length > 0) {
      let animationStop = null;
      do {
        animationStop = this.animationStops.shift();
        if (animationStop.type === 'position') {
          lastPositionStop = animationStop;
          if (this.manualLookTargetPosition &&
            this.manualLookTargetPosition.distanceTo(this.lookTarget.position) > 10
          ) {
            this.cameraRigLookAt(this.manualLookTargetPosition);
          }
        }
        if (animationStop.type !== 'pause') {
          const tween = this.getTweenForAnimationStop(animationStop);
          if (!rootTween) {
            rootTween = tween;
            lastTween = tween;
          } else {
            lastTween.chain(tween);
            lastTween = tween;
          }
        }
      } while (animationStop.type !== 'pause' && this.animationStops.length > 0);
      this.currentStop = lastPositionStop;
      rootTween.start();
      if (!this.shouldEnablePrevChevron()) {
        this.disablePrevChevron();
      }
      if (this.shouldEnableNextChevron()) {
        this.enableNextChevron();
      }
    }
  }

  setchevronLookTarget(position) {
    this.chevronLookAtTarget = position;
  }

  handleBackClick() {
    if (TWEEN.getAll().length !== 0) {
      return false;
    }

    if (this.previousAnimationStops) {
      if (this.previousAnimationStops.length > 0) {
        let repositionTween = null;
        if (this.currentStop) {
          this.animationStops.unshift(this.currentStop);
          this.currentStop = null;
        }
        const previousAnimationStop = this.previousAnimationStops.pop();
        this.currentStop = previousAnimationStop;
        if (previousAnimationStop.type === 'position') {
          if (this.manualLookTargetPosition &&
            this.manualLookTargetPosition.distanceTo(this.lookTarget.position) > 10
          ) {
            const manualLookTargetPosition = this.manualLookTargetPosition.clone();
            repositionTween = new TWEEN.Tween(manualLookTargetPosition)
              .to(this.lookTarget.position.clone(), this.tweenLengthInMs * 2)
              .easing(TWEEN.Easing.Linear.None)
              .onUpdate(() => {
                this.cameraRigLookAt(manualLookTargetPosition);
              });
          }
        }
        let tween = this.getTweenForAnimationStop(previousAnimationStop);
        if (repositionTween) {
          repositionTween.chain(tween);
          tween = repositionTween;
        }

        tween.start();
        if (!this.shouldEnablePrevChevron()) {
          this.disablePrevChevron();
        }

        if (this.shouldEnableNextChevron()) {
          this.enableNextChevron();
        }

        return true;
      }

      if (this.onPrevHole) {
        return this.onPrevHole();
      }
    }

    return false;
  }

  updateChevronPosition(mousePosition) {
    if (this.currentHole) {
      this.raycaster.setFromCamera(mousePosition, this.camera);

      const intersects = this.raycaster.intersectObject(this.modelMeshGroup, true);
      if (intersects.length > 0) {
        this.chevron.position.copy(intersects[0].point);
        let distanceToNextStop;
        let distanceToPreviousStop;
        if (this.animationStops.length > 0) {
          distanceToNextStop = this.chevron.position.distanceTo(this.animationStops[0].value);
        } else {
          distanceToNextStop = this.chevron.position.distanceTo(this.currentHole.marker.position);
        }

        if (this.previousAnimationStops.length > 0) {
          distanceToPreviousStop = this.chevron.position.distanceTo(
            this.previousAnimationStops[this.previousAnimationStops.length - 1].value
          );
          if (distanceToNextStop < distanceToPreviousStop) {
            this.setchevronLookTarget(this.currentHole.marker.position);
          } else {
            this.setchevronLookTarget(this.currentHole.tees[0].marker.position);
          }
        } else {
          this.setchevronLookTarget(this.currentHole.marker.position);
        }
        this.chevron.lookAt(this.chevronLookAtTarget);
      }
    }
  }

  handleMouseMove(event) {
    if (this.chevronLookAtTarget) {
      this.mousePosition.x = ((event.clientX / this.renderer.domElement.clientWidth) * 2) - 1;
      this.mousePosition.y = (-(event.clientY / this.renderer.domElement.clientHeight) * 2) + 1;
      this.updateChevronPosition(this.mousePosition);
    }
  }

  handleClick(event) {
    this.mousePosition.x = ((event.clientX / this.renderer.domElement.clientWidth) * 2) - 1;
    this.mousePosition.y = (-(event.clientY / this.renderer.domElement.clientHeight) * 2) + 1;
    this.raycaster.setFromCamera(this.mousePosition, this.camera);
    const intersects = this.raycaster.intersectObject(this.cameraRig, true);
    let staticChevronClicked = false;
    if (intersects.length > 0) {
      if (intersects[0].object && intersects[0].object.name) {
        switch (intersects[0].object.name) {
          case 'prevChevron':
            this.handleBackClick();
            staticChevronClicked = true;
            break;
          case 'nextChevron':
            this.handleForwardClick();
            staticChevronClicked = true;
            break;
          default: break;
        }
      }
    }

    if (staticChevronClicked) {
      return;
    }

    if (this.currentHole) {
      if (this.chevronLookAtTarget) {
        if (this.chevronLookAtTarget === this.currentHole.marker.position) {
          this.handleForwardClick();
        } else {
          this.handleBackClick();
        }
      }
    }
  }

  disablePrevChevron() {
    this.prevChevron.disabled = true;
    this.camera.remove(this.prevChevron);
  }

  disableNextChevron() {
    this.nextChevron.disabled = true;
    this.camera.remove(this.nextChevron);
  }

  enableNextChevron() {
    if (this.nextChevron.disabled) {
      this.camera.add(this.nextChevron);
    }
  }

  enablePrevChevron() {
    if (this.prevChevron.disabled) {
      this.camera.add(this.prevChevron);
    }
  }

  shouldEnableNextChevron() {
    return this.staticChevronsEnabled;
  }

  shouldEnablePrevChevron() {
    return this.staticChevronsEnabled;
  }

  handleForwardClick() {
    if (TWEEN.getAll().length !== 0) {
      return false;
    }

    if (this.animationStops) {
      if (this.animationStops.length > 0) {
        const animationStop = this.animationStops.shift();
        if (this.currentStop) {
          this.previousAnimationStops.push(this.currentStop);
        }
        this.currentStop = animationStop;
        let repositionTween = null;
        if (animationStop.type === 'position') {
          if (this.manualLookTargetPosition &&
            this.manualLookTargetPosition.distanceTo(this.lookTarget.position) > 10
          ) {
            const manualLookTargetPosition = this.manualLookTargetPosition.clone();
            repositionTween = new TWEEN.Tween(manualLookTargetPosition)
              .to(this.lookTarget.position.clone(), this.tweenLengthInMs * 2)
              .easing(TWEEN.Easing.Linear.None)
              .onUpdate(() => {
                this.cameraRigLookAt(manualLookTargetPosition);
              });
          }
        }
        let tween = this.getTweenForAnimationStop(animationStop);
        if (repositionTween) {
          repositionTween.chain(tween);
          tween = repositionTween;
        }
        tween.start();
        if (!this.shouldEnableNextChevron()) {
          this.disableNextChevron();
        }

        if (this.shouldEnablePrevChevron()) {
          this.enablePrevChevron();
        }
        return true;
      }

      if (this.onNextHole) {
        return this.onNextHole();
      }
    }

    return false;
  }

  moveCameraToHole(hole) {
    // Don't go to hole until we are done loading
    if (!this.loader.initialCubesLoaded) {
      this.lastNavigationTarget = hole;
      this.moveCameraToDefaultPosition();
      return;
    }

    this.currentHole = hole;

    this.setchevronLookTarget(hole.marker.position);
    // Move camera up to default height (while looking at current target?)

    if (!this.lookTarget) {
      // First move, don't animate
      this.cameraRig.position.set(
        hole.tees[0].marker.position.x,
        hole.tees[0].marker.position.y + 15,
        hole.tees[0].marker.position.z
      );
      this.cameraRigLookAt(hole.marker.position);
      this.cameraRig.translateOnAxis(new THREE.Vector3(0, 0, 1), 75);
      return;
    }
    const allTweens = TWEEN.getAll();
    TWEEN.removeAll();

    this.animationStops = [];
    this.previousAnimationStops = [];

    this.tweenSpeedPointsPerMs = 400 / 3000; // points per millisecond
    this.automatedTweenSpeedPointsPerMs = 1000 / 2000;
    this.tweenLengthInMs = 500;

    const moveToHoleRiseUpHeight = 100;

    const targetVector = this.cameraRig.position.clone();
    targetVector.y += moveToHoleRiseUpHeight;
    let stops = Math.ceil(
      moveToHoleRiseUpHeight / this.automatedTweenSpeedPointsPerMs / this.tweenLengthInMs
    );

    let curve = new THREE.CatmullRomCurve3([
      this.cameraRig.position.clone(),
      targetVector,
    ]);
    curve.getSpacedPoints(stops).forEach((point, index) => {
      if (index !== 0) {
        this.animationStops.push({ type: 'position', value: point });
      }
    });

    // var upToDefaultHeightTween = new TWEEN.Tween(this.cameraRig.position).
    // to({
    //     y: this.cameraRig.position.y + 100
    // }, 3000).
    //    easing(TWEEN.Easing.Linear.None).
    // onUpdate(() => { this.cameraRigLookAt(this.lookTarget.position); });
    // .onComplete(() => console.log('upToDefaultHeightTween done'));


    // var lookAtNewHoleTween = new TWEEN.Tween(this.lookTarget.position).
    // to(hole.marker.position, 3000).
    // easing(TWEEN.Easing.Linear.None).
    // onUpdate(() => {
    //     this.cameraRigLookAt(this.lookTarget.position);
    // });

    const distance = this.lookTarget.position.distanceTo(hole.marker.position);
    stops = Math.ceil(distance / this.automatedTweenSpeedPointsPerMs / this.tweenLengthInMs);
    curve = new THREE.CatmullRomCurve3([
      this.lookTarget.position.clone(),
      hole.marker.position.clone(),
    ]);
    curve.getSpacedPoints(stops).forEach((point, index) => {
      if (index !== 0) {
        this.animationStops.push({ type: 'looktargetposition', value: point });
      }
    });

    // upToDefaultHeightTween.chain(lookAtNewHoleTween);

    const moveBackVector = hole.tees[0].marker.position.clone().sub(hole.marker.position);
    moveBackVector.normalize();

    const finalPosition = hole.tees[0].marker.position.clone().addScaledVector(moveBackVector, 15);
    finalPosition.y += 6;

    // var positionTween = new TWEEN.Tween(this.cameraRig.position).to({
    //     x: finalPosition.x,
    //     y: finalPosition.y,
    //     z: finalPosition.z
    // }, 5000).easing(TWEEN.Easing.Linear.None).onUpdate(() => {
    //     this.cameraRigLookAt(hole.marker.position);
    // });

    stops = Math.ceil(
      targetVector.distanceTo(finalPosition) /
      this.automatedTweenSpeedPointsPerMs /
      this.tweenLengthInMs
    );
    curve = new THREE.CatmullRomCurve3([
      targetVector.clone(),
      finalPosition,
    ]);
    curve.getSpacedPoints(stops).forEach((point, index) => {
      if (index !== 0) {
        this.animationStops.push({ type: 'position', value: point });
      }
    });

    // lookAtNewHoleTween.chain(positionTween);


    const holeBackedUpPosition = hole.marker.position.clone().addScaledVector(moveBackVector, 60);
    holeBackedUpPosition.y += 15;
    // var moveToHoleTween = new TWEEN.Tween(this.cameraRig.position).to({
    //     x: holeBackedUpPosition.x,
    //     y: [
    //          holeBackedUpPosition.y + finalPosition.distanceTo(hole.marker.position) / 8,
    //          holeBackedUpPosition.y
    //        ],
    //     z: holeBackedUpPosition.z
    // }, 8000).easing(TWEEN.Easing.Linear.None).onUpdate(() => {
    //     this.cameraRigLookAt(hole.marker.position);
    // });

    // moveToHoleTween.delay(this.tweenLengthInMs);
    // add delay = 1 second day
    //  (this should be clculated as speed/animationsteplengthinsecs or something)
    this.animationStops.push({ type: 'pause' });
    stops = Math.ceil(
      finalPosition.distanceTo(holeBackedUpPosition) /
      this.tweenSpeedPointsPerMs /
      this.tweenLengthInMs
    );
    curve = new THREE.CatmullRomCurve3([
      finalPosition,
      finalPosition.clone().lerp(holeBackedUpPosition, 0.5).add(
        new THREE.Vector3(0, finalPosition.distanceTo(hole.marker.position) / 8,
          0
        )),
      holeBackedUpPosition,
    ]);
    curve.getSpacedPoints(stops).forEach((point, index) => {
      if (index !== 0) {
        this.animationStops.push({ type: 'position', value: point });
      }
    });

    // positionTween.chain(moveToHoleTween);

    // upToDefaultHeightTween.start();


    // this.animationStops.forEach((stop) => {
    //     console.log(`${stop.type} : ${(stop.type === 'pause') ? '' : \
    //                 `(${stop.value.x}, ${stop.value.y}, ${stop.value.z})`}`);
    // });


    this.runAnimationTillPause();

    // this.cameraRig.position.set(
    //   hole.marker.position.x,
    //   this.cameraPos.y,
    //   hole.marker.position.z
    // );
    // console.log(`Move to ${hole.HoleNumber}`);
    // console.log(hole);
    // this.cameraRig.position.set(
    //   hole.tees[0].marker.position.x,
    //   hole.tees[0].marker.position.y + 30,
    //   hole.tees[0].marker.position.z
    // );


    // var currentCameraRotation = this.camera.rotation.clone();
    // var currentCameraRigRortation = this.cameraRig.rotation.clone();
    // console.log(`Current Camera World Direction: \
    //             ${this.camera.getWorldDirection().x} \
    //             ${this.camera.getWorldDirection().y} \
    //             ${this.camera.getWorldDirection().z}`);
    // console.log(`Current Camera Rotation: \
    //             ${currentCameraRotation.x} \
    //             ${currentCameraRotation.y} \
    //             ${currentCameraRotation.z}`);
    // console.log(`Current CameraPosition \
    //             ${this.camera.position.x} \
    //             ${this.camera.position.y} \
    //             ${this.camera.position.z}`);
    // console.log(`Current Rig Rotaiton: \
    //             ${currentCameraRigRortation.x} \
    //             ${currentCameraRigRortation.y} \
    //             ${currentCameraRigRortation.z}`);
    // console.log(`Current Rig POsition \
    //             ${this.cameraRig.position.x} \
    //             ${this.cameraRig.position.y} \
    //             ${this.cameraRig.position.z}`);
    // this.cameraRigLookAt(hole.marker.position);
  }

  stop() {
    clearTimeout(this.timerToken);
  }

  shutdown() {
    const allTweens = TWEEN.getAll();
    TWEEN.removeAll();
    // Probably need to dispose of everything Three js related
    // TODO: Validate the following
    // https://stackoverflow.com/questions/21453309/how-can-i-destroy-threejs-scene
    cancelAnimationFrame(this.nextAnimationRequestId);

    this.controls.dispose();
    delete this.controls.handleclick;
    delete this.controls.handleMouseMove;
    delete this.controls;

    // this.cleanSkybox();

    if (this.holesAndTees) {
      this.holesAndTees.forEach((holeOrTee) => {
        const marker = holeOrTee.marker;
        delete holeOrTee.marker;
        this.scene.remove(marker);
      });
    }

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

    if (this.markerMaterial) {
      this.markerMaterial.dispose();
      delete this.markerMaterial;
    }

    if (this.markerGeometry) {
      this.markerGeometry.dispose();
      delete this.markerGeometry;
    }

    if (this.chevronGeometry) {
      this.chevronGeometry.dispose();
      delete this.chevronGeometry;
    }

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
