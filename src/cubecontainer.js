/* eslint no-unused-vars: ["off", { "args": "none" }]*/
/* eslint no-console: ["off"]*/
/* eslint comma-dangle: ["error", "only-multiline"]*/
/* global URL:false, document:false */

import THREE from 'three';
import CubeBounds from './cubebounds.js';
import CTMLoader from './ctm/CTMLoader.js';
import Pyrite from './pyrite.js';
import Api from './api.js';
import PyriteException from './pyriteexception.js';

class CubeContainer {
  constructor(detailLevel, config, cube) {
    this.config = config;
    this.isLoaded = false;
    this.isLoading = false;
    this.initialized = false;
    this.debug = false;
    this.upgraded = false;
    this.upgrading = false;
    this.detailLevel = detailLevel;
    this.canDowngrade = false;
    this.upgradeChildren = [];
    this.downgradeParent = null;
    this.cube = cube;
    this.meshName = `L${this.detailLevel.Value}-${this.cube.x}_${this.cube.y}_${this.cube.z}`;
    this.isHidden = false;
  }

  init(cubeContainerGroup, modelMeshGroup) {
    this.cubeContainerGroup = cubeContainerGroup;
    this.modelMeshGroup = modelMeshGroup;
    this.createPlaceholder();
    this.initialized = true;
    this.canDowngrade = false;
  }

  dispose() {
    this.unload(true);
    this.deinit();
    delete this.upgradeChildren;
    delete this.downgradeParent;
    delete this.modelMeshGroup;
    delete this.cubeContainerGroup;
    delete this.meshName;
    delete this.cube;
    delete this.detailLevel;
    delete this.config;
    this.disposed = true;
  }

  deinit() {
    this.removePlaceholder();
    this.initialized = false;
  }

  hidePlaceholder() {
    if (this.cubeContainerGroup && this.placeholderMesh) {
      this.cubeContainerGroup.remove(this.placeholderMesh);
    }
  }

  showPlaceholder() {
    if (this.cubeContainerGroup && this.placeholderMesh) {
      this.cubeContainerGroup.add(this.placeholderMesh);
    }
  }

  removePlaceholder() {
    this.hidePlaceholder();
    if (this.placeholderMesh) {
      this.placeholderMesh.geometry.dispose();
      this.placeholderMesh = null;
    }
  }

  createPlaceholder() {
    const worldScale = new THREE.Vector3().copy(this.detailLevel.WorldCubeScale);
    this.placeholderMesh = new THREE.Mesh(
      new THREE.BoxGeometry(worldScale.x, worldScale.y, worldScale.z),
      CubeContainer.placeholderMaterial[this.detailLevel.Value]
    );
    this.placeholderMesh.frustumCulled = false;
    this.placeholderMesh.name = `ph_${this.meshName}`;
    this.placeholderMesh.position.set(
      this.cube.worldCoords.x,
      this.cube.worldCoords.z,
      -this.cube.worldCoords.y
    );
    this.placeholderMesh.geometry.computeBoundingBox();
    this.placeholderMesh.geometry.computeBoundingSphere();
    this.placeholderMesh.geometry.boundingSphere.center.set(
      this.cube.worldCoords.x,
      this.cube.worldCoords.z,
      -this.cube.worldCoords.y
    );
  }

  load(callback, skipSetIsLoading) {
    if (!this.initialized || this.disposed) {
      return;
    }

    // When called in the timeout callback don't set isloading
    if (!skipSetIsLoading) {
      this.isLoading = true;
    }

    // Check if this cube is still needed
    if (!this.isLoading) {
      return;
    }

    // Check if lwoest LOD. If so and if previously hidden then just unhide
    if (!this.downgradeParent) {
      if (this.isHidden) {
        // console.log(`Showing ${this.meshName}`);
        this.isLoading = false;
        this.isLoaded = true;
        this.mesh.visible = true;
        this.isHidden = false;
        return;
      }
    }

    // load the texture first - it might be slow to load the first few cubes
    const textureState = this.detailLevel.Query.loader.textureState.get(this.textureUrl);
    switch (textureState) {
      case 'loading':
        setTimeout(() => { if (this.isLoading) { this.load(callback, true); } }, 500);
        break;
      case 'loaded': {
        const texture = this.detailLevel.Query.loader.cache.get(this.textureUrl);
        this.loadmesh(texture, callback);
        break;
      }
      case 'unloaded': {
        this.detailLevel.Query.loader.textureState.set(this.textureUrl, 'loading');

        const texture = new THREE.Texture();
        const scope = this;
        Api.cachedGet(this.textureUrl, 'blob').then((result) => {
          const image = document.createElementNS('http://www.w3.org/1999/xhtml', 'img');
          image.onload = function onload() {
            URL.revokeObjectURL(image.src);
            if (scope.detailLevel) {
              texture.format = THREE.RGBFormat;
              texture.image = image;
              texture.needsUpdate = true;
              scope.detailLevel.Query.loader.textureState.set(scope.textureUrl, 'loaded');
              scope.detailLevel.Query.loader.cache.getSet(scope.textureUrl, texture);
              scope.loadmesh(texture, callback);
            }
          };
          image.src = URL.createObjectURL(result);
        });
        break;
      }
      default:
        throw new PyriteException(`Unknown textureState = ${textureState}`, 'CubeContainer');
    }
  }

  unload(force) {
    if (this.debug) {
      this.cubeContainerGroup.remove(this.bbox);
    }


    if (!this.downgradeParent && !force) {
      // This is a lowest leve LOD cube that we want to keep in memory
      if (this.mesh) {
        this.mesh.visible = false;
        this.isHidden = true;
      }
      this.isLoaded = false;
      this.isLoading = false;
      return;
    }


    if (this.detailLevel.Query.loader.textureState.get(this.textureUrl) === 'loaded') {
      if (this.detailLevel.Query.loader.cache.release(this.textureUrl) === 0) {
        const texture = this.detailLevel.Query.loader.cache.remove(this.textureUrl);
        this.detailLevel.Query.loader.textureState.set(this.textureUrl, 'unloaded');
        if (texture) {
          texture.dispose();
        } else {
          throw new PyriteException('Error: Texture was not in cache.', 'CubeContainer');
        }

        if (this.mesh) {
          this.mesh.material.dispose();
        }
      }
    }

    if (this.mesh) {
      this.modelMeshGroup.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh = null;
    }

    this.isLoaded = false;
    this.isLoading = false;
  }

  loadMeshWithGeometry(texture, geometry, callback) {
    if (!this.isLoading) {
      // Loading has been cancelled
      geometry.dispose();
      return;
    }

    const material = new THREE.MeshStandardMaterial(
      {
        color: 0xdddddd,
        metalness: 0,
        map: texture,
        fog: false,
      }
    );
    // material.map = texture;
    // material.map.needsUpdate = true;
    // material.needsUpdate = true;
    const mesh = new THREE.Mesh(geometry, material);
    this.mesh = mesh;
    mesh.frustumCulled = false;
    mesh.name = this.meshName;
    this.hidePlaceholder();
    this.modelMeshGroup.add(mesh);
    this.isLoaded = true;
    this.isLoading = false;
    if (this.debug) {
      this.addBoundingBox(mesh);
      // var axisHelper = new THREE.AxisHelper(50);
      // axisHelper.position.set(_this.cube.worldCoords.x,
      //                         _this.cube.worldCoords.z,
      //                         -_this.cube.worldCoords.y);
      // _this.cubeContainerGroup.add(axisHelper);
    }

    // // When done loading model see if any markers are near by that need height set
    // // If so raycast to set height and if successful take them out of the near marker list
    // if (this.nearMarkers) {
    //     this.nearMarkers.forEach((marker) => {
    //         let raycaster = new THREE.Raycaster();
    //         let down = new THREE.Vector3(0, -1, 0);
    //         let up = new THREE.Vector3(0, 1, 0);
    //         raycaster.set(marker.marker.position, down);
    //         let intersects = raycaster.intersectObject(this.mesh);
    //         if (intersects.length > 0) {
    //             let translateYValue = -1 * (intersects[0].distance);

    //             marker.marker.translateY(-1 * (intersects[0].distance));
    //             if (marker.TeeId) {
    //                 console.log(`Tee: ${marker.TeeId} ${translateYValue} \
    //                               ${marker.marker.position.y}`);
    //             } else {
    //                 console.log(`Hole: ${marker.HoleId} ${translateYValue} \
    //                              ${marker.marker.position.y}`);
    //             }
    //             marker.nearCubes.forEach((nearCube) => {
    //                 if (nearCube !== this && nearCube.nearMarkers) {
    //                     let mIndex = nearCube.nearMarkers.indexOf(marker);
    //                     if (mIndex !== -1) {
    //                         nearCube.nearMarkers.splice(mIndex, 1);
    //                     }
    //                 }
    //             });
    //             delete marker.nearCubes;
    //         } else {
    //             raycaster.set(marker.marker.position, up);
    //             let intersects = raycaster.intersectObject(this.mesh);
    //             if (intersects.length > 0) {
    //                 let translateYValue =  (intersects[0].distance);

    //                 marker.marker.translateY( (intersects[0].distance));
    //                 if (marker.TeeId) {
    //                     console.log(`uTee: ${marker.TeeId} ${translateYValue} \
    //                                  ${marker.marker.position.y}`);
    //                 } else {
    //                     console.log(`uHole: ${marker.HoleId} ${translateYValue} \
    //                                  ${marker.marker.position.y}`);
    //                 }
    //                 marker.nearCubes.forEach((nearCube) => {
    //                     if (nearCube !== this && nearCube.nearMarkers) {
    //                         let mIndex = nearCube.nearMarkers.indexOf(marker);
    //                         if (mIndex !== -1) {
    //                             nearCube.nearMarkers.splice(mIndex, 1);
    //                         }
    //                     }
    //                 });
    //                 delete marker.nearCubes;
    //             } else {
    //                 if (marker.TeeId) {
    //                     console.log(`aTee: ${marker.TeeId} na ${marker.marker.position.y}`);
    //                 } else {
    //                     console.log(`aHole: ${marker.HoleId} na ${marker.marker.position.y}`);
    //                 }
    //             }
    //         }
    //     });

    //     // We did what we could. Remvoe marker array so we don't try again
    //     delete this.nearMarkers;
    // }

    if (typeof callback === 'function') {
      callback();
    }
  }

  loadmesh(texture, callback) {
    // if (this.detailLevel.Query.loader.cache.contains(this.geometryUrl)) {
    //     var geometry = this.detailLevel.Query.loader.cache.get(this.geometryUrl);
    //     this.loadMeshWithGeometry(texture, geometry, callback);
    //     return;
    // }
    const cache = this.detailLevel.isLowestLod();

    const loader = new THREE.CTMLoader();

    loader.load(`${this.geometryUrl}?fmt=ctm`, (geometry) => {
      // this.detailLevel.Query.loader.cache.getSet(this.geometryUrl, geometry);
      this.loadMeshWithGeometry(texture, geometry, callback);
    }, cache); // , {useWorker: false, worker: new Worker('js/ctm/CTMWorker.js')} );
  }

  addBoundingBox(mesh) {
    const value = this.detailLevel.Value;
    const cubeContainerGroup = this.cubeContainerGroup;
    let hex = 0xff0000;
    switch (value) {
      case 0:
        hex = 0xffffff;
        break;
      case 1:
        hex = 0xff0000;
        break;
      case 2:
        hex = 0xff8000;
        break;
      case 3:
        hex = 0xffff00;
        break;
      case 4:
        hex = 0x00ff00;
        break;
      default:
        hex = 0xffffff;
        break;
    }
    this.bbox = new THREE.BoundingBoxHelper(mesh, hex);
    this.bbox.update();
    cubeContainerGroup.add(this.bbox);
  }

  upgradable() {
    return !this.upgraded && !this.upgrading;
  }

  downgradable() {
    return this.upgraded && !this.upgrading;
  }

  shouldUpgrade(cameraPos) {
    if (this.detailLevel.isHighestLod() || this.detailLevel.Value < this.config.maxlod) {
      return false;
    }

    if (this.mesh) {
      const distance = this.cube.worldCoords.distanceTo(cameraPos);
      return distance < this.detailLevel.UpgradeDistance;
    }
    return false;
  }

  shouldDowngrade(cameraPos) {
    if (this.mesh) {
      const distance = this.cube.worldCoords.distanceTo(cameraPos);
      return distance > this.detailLevel.DowngradeDistance;
    }

    return false;
  }
}

CubeContainer.placeholderMaterial = {
  1: new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.35 }),
  2: new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.35 }),
  3: new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.35 }),
  4: new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.35 }),
  5: new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.35 }),
  6: new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.35 }),
};

export default CubeContainer;
