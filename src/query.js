/* eslint no-unused-vars: ["off", { "args": "none" }]*/
/* eslint no-console: ["off"]*/

import THREE from 'three';
import $ from 'jquery';
import projectConfig from 'config';
import PyriteDetailLevel from './detaillevel.js';
import Cube from './cube.js';
import CubeContainer from './cubecontainer.js';
import CubeBounds from './cubebounds.js';
import Dictionary from './dictionary.js';
import Pyrite from './pyrite.js';
import Api from '../../actions/api.js';

class PyriteQuery {
  constructor(loader, config) {
    this.DetailLevels = [];
    this.upgradeConstant = 0.0;
    this.upgradeFactor = 1.15;
    this.downgradeConstant = 0.0;
    this.downgradeFactor = 1.25;
    this.loader = loader;
    this.config = config;
    this.debug = false;
    this.api = new Api();
  }

  loadMetadata(onLoad) {
    this.versionUrl = `${this.config.server}sets/${this.config.set}/${this.config.version}/`;
    this.api.cachedGet(this.versionUrl, 'json').then((r) => {
      if (this.unloaded) {
        // We've unloaded, throw this response away
        return;
      }

      if (r.status === 'OK') {
        const detailLevels = r.result.detailLevels;
        let previousLevel = null;
        for (let i = 0; i < detailLevels.length; i += 1) {
          const dl = new PyriteDetailLevel(
            this,
            this.loader.pyrite.cubeDetectorGroup,
            this.loader.pyrite.modelMeshGroup
          );
          dl.Name = detailLevels[i].name;
          const value = parseInt(dl.Name.substring(1), 10);
          dl.Value = value;
          dl.SetSize = new THREE.Vector3(
            detailLevels[i].setSize.x,
            detailLevels[i].setSize.y,
            detailLevels[i].setSize.z
          );
          dl.TextureSetSize = new THREE.Vector2(
            detailLevels[i].textureSetSize.x,
            detailLevels[i].textureSetSize.y
          );
          dl.ModelBoundsMax = new THREE.Vector3(
            detailLevels[i].modelBounds.max.x,
            detailLevels[i].modelBounds.max.y,
            detailLevels[i].modelBounds.max.z
          );
          dl.ModelBoundsMin = new THREE.Vector3(
            detailLevels[i].modelBounds.min.x,
            detailLevels[i].modelBounds.min.y,
            detailLevels[i].modelBounds.min.z
          );
          dl.WorldBoundsMax = new THREE.Vector3(
            detailLevels[i].worldBounds.max.x,
            detailLevels[i].worldBounds.max.y,
            detailLevels[i].worldBounds.max.z
          );
          dl.WorldBoundsMin = new THREE.Vector3(
            detailLevels[i].worldBounds.min.x,
            detailLevels[i].worldBounds.min.y,
            detailLevels[i].worldBounds.min.z
          );
          dl.WorldCubeScale = new THREE.Vector3(
            detailLevels[i].worldCubeScale.x,
            detailLevels[i].worldCubeScale.y,
            detailLevels[i].worldCubeScale.z
          );
          dl.WorldBoundsSize = dl.WorldBoundsMax.sub(dl.WorldBoundsMin);
          dl.DowngradeDistance = (dl.WorldCubeScale.length() * this.downgradeFactor) +
            this.downgradeConstant;
          dl.UpgradeDistance = (dl.WorldCubeScale.length() * this.upgradeFactor) +
            this.upgradeConstant;
          dl.LODUpperThreshold = 0.95;
          dl.LODLowerThreshold = 0.35;
          dl.worldCenterPos = new THREE.Vector3();
          dl.upgradeLevel = previousLevel;
          if (previousLevel) {
            previousLevel.downgradeLevel = dl;
          }
          previousLevel = dl;
          this.DetailLevels.push(dl);
        }
        if (this.config.useworldbounds) {
          // calculate the world bounds from the metaData
          const highestlod = detailLevels[0];
          const lowestlod = detailLevels[detailLevels.length - 1];
          const altitudeTransform = 0 - lowestlod.modelBounds.min.z;
          const min = new THREE.Vector3(
            highestlod.modelBounds.min.x + (lowestlod.worldCubeScale.x / 2),
            highestlod.modelBounds.min.z + (lowestlod.worldCubeScale.z / 4),
            highestlod.modelBounds.min.y + (lowestlod.worldCubeScale.y / 2)
          );
          const max = new THREE.Vector3(
            highestlod.modelBounds.max.x - (lowestlod.worldCubeScale.x / 2),
            highestlod.modelBounds.max.z + (lowestlod.worldCubeScale.z * 1.5),
            highestlod.modelBounds.max.y - (lowestlod.worldCubeScale.y / 2)
          );
          // var min = new THREE.Vector3(highestlod.modelBounds.min.x,
          // highestlod.modelBounds.min.z,
          // highestlod.modelBounds.min.y);
          // var max = new THREE.Vector3(highestlod.modelBounds.max.x,
          // highestlod.modelBounds.max.z + altitudeTransform,
          // highestlod.modelBounds.max.y);
          // this.loader.pyrite.controls.movementBounds = new THREE.Box3(min, max);
        }
        onLoad();
      }
    });
  }

  setCamera(dl) {
    const geometryTransform = (dl.ModelBoundsMax.y) / 2.0;
    const min = new THREE.Vector3(dl.ModelBoundsMin.x, dl.ModelBoundsMin.y, dl.ModelBoundsMin.z);
    const max = new THREE.Vector3(dl.ModelBoundsMax.x, dl.ModelBoundsMax.y, dl.ModelBoundsMax.z);
    const maxmin = new THREE.Vector3().copy(max).sub(min);
    const maxminHalf = new THREE.Vector3().copy(maxmin).divideScalar(2);
    const newCameraPosition = new THREE.Vector3().copy(min).add(maxminHalf);
    newCameraPosition.set(newCameraPosition.x, newCameraPosition.z, -newCameraPosition.y);
    newCameraPosition.add(new THREE.Vector3(0, maxmin.z * 1.4, 0));
    this.loader.pyrite.setCamera(newCameraPosition, new THREE.Euler(-45, 0, 0));
  }

  unload() {
    if (this.DetailLevels) {
      this.DetailLevels.forEach((dl) => {
        dl.dispose();
      });
      this.DetailLevels = null;
    }

    this.api = null;
    this.config = null;
    this.loader = null;
    this.unloaded = true;
  }

  loadAll(callback, thingsThatNeedElevation) {
    this.loadMetadata(() => {
      const vals = this.DetailLevels;
      let loadedLevels = 0;
      // this.setCamera(vals[0]);
      vals.forEach((dl, dlIndex) => {
        const maxboundingboxquery =
          `${dl.WorldBoundsMin.x},${dl.WorldBoundsMin.y},${dl.WorldBoundsMin.z}` +
          `/${dl.WorldBoundsMax.x},${dl.WorldBoundsMax.y},${dl.WorldBoundsMax.z}`;
        const cubesUrl = `${this.versionUrl}query/${dl.Name}/${maxboundingboxquery}`;

        this.api.cachedGet(cubesUrl, 'json').then((r) => {
          if (this.unloaded) {
            // We've unloaded, throw this response away
            return;
          }

          if (dl.downgradeLevel) {
            dl.downgradeLevel.childrenMap = [];
          }
          const cubes = r.result;
          for (let i = 0; i < cubes.length; i += 1) {
            const cube = new Cube();
            cube.x = cubes[i][0];
            cube.y = cubes[i][1];
            cube.z = cubes[i][2];
            const cubeContainer = new CubeContainer(dl, this.config, cube);


            if (dl.downgradeLevel) {
              const factor = this.getNextCubeFactor(dl.downgradeLevel.Value - 1);
              const downgradeParentIndex = `${Math.floor(cubeContainer.cube.x / factor.x)}_` +
                `${Math.floor(cubeContainer.cube.y / factor.y)}_` +
                `${Math.floor(cubeContainer.cube.z / factor.z)}`;
              if (!dl.downgradeLevel.childrenMap[downgradeParentIndex]) {
                dl.downgradeLevel.childrenMap[downgradeParentIndex] = [];
              }

              dl.downgradeLevel.childrenMap[downgradeParentIndex].push(cubeContainer);
            }

            const min = new THREE.Vector3(cubeContainer.cube.x,
              cubeContainer.cube.y,
              cubeContainer.cube.z
            );
            const max = new THREE.Vector3(min.x + 1, min.y + 1, min.z + 1);
            // cubeContainer.bounds = new CubeBounds(cubeContainer);
            // cubeContainer.bounds.boundingBox = new THREE.Box3(min, max);
            cubeContainer.useEbo = this.config.fmt === 'ebo';
            cubeContainer.useCtm = this.config.fmt === 'ctm';
            cubeContainer.debug = this.config.debug === 1;
            cubeContainer.textureCoords = dl.getTextureCoordinatesForCube(
              cubeContainer.cube.x,
              cubeContainer.cube.y
            );
            cubeContainer.textureUrl = this.getTexturePath(
              dl.Name,
              cubeContainer.textureCoords.x,
              cubeContainer.textureCoords.y
            );
            cubeContainer.geometryUrl = this.getModelPath(
              dl.Name,
              cubeContainer.cube.x,
              cubeContainer.cube.y, cubeContainer.cube.z
            );
            if (!this.loader.textureState.contains(cubeContainer.textureUrl)) {
              this.loader.textureState.set(cubeContainer.textureUrl, 'unloaded');
            }
            dl.addCube(cubeContainer);
          }

          dl.fixWorldCoords();

          const clonedThingsThatNeedElevation = thingsThatNeedElevation.slice(0);
          const halfWorldCubeScale = dl.WorldCubeScale.x / 2;

          if (dlIndex === 0) {
            for (let i = 0; i < clonedThingsThatNeedElevation.length; i += 1) {
              // console.log(clonedThingsThatNeedElevation[i]);
              if (this.loader.pyrite.modelConfig.markerYOffsets) {
                const translateYValue = this.loader.pyrite.modelConfig.markerYOffsets[
                  clonedThingsThatNeedElevation[i].TeeId ||
                  clonedThingsThatNeedElevation[i].HoleId
                ];
                if (translateYValue) {
                  // console.log(`Fixing ${clonedThingsThatNeedElevation[i].TeeId ||
                  //  clonedThingsThatNeedElevation[i].HoleId} to ${translateYValue}`);
                  clonedThingsThatNeedElevation[i].marker.position.y = translateYValue;
                }
              }
            }
          }

          // // Look through all cubes to find which ones have markers in the same x,z range
          // // Add markers to nearMarkers array (Created if it doesnt exist)
          // // Add the cube to the nearCubes list in the marker (Created if it doesnt exist)
          // dl.Cubes.forEach((cubeContainer) => {

          //     for (let i = 0; i < clonedThingsThatNeedElevation.length; i += 1) {

          //         if ((cubeContainer.cube.correctedWorldCoords.x - halfWorldCubeScale <
          //         clonedThingsThatNeedElevation[i].marker.position.x) &&
          //             (cubeContainer.cube.correctedWorldCoords.x + halfWorldCubeScale >
          //             clonedThingsThatNeedElevation[i].marker.position.x)) {
          //             if ((cubeContainer.cube.correctedWorldCoords.z - halfWorldCubeScale
          //             < clonedThingsThatNeedElevation[i].marker.position.z) &&
          //                 (
          //                   cubeContainer.cube.correctedWorldCoords.z + halfWorldCubeScale
          //                    >
          //                   clonedThingsThatNeedElevation[i].marker.position.z
          //                 )) {

          //                 if (!clonedThingsThatNeedElevation[i].nearCubes) {
          //                     clonedThingsThatNeedElevation[i].nearCubes = [];
          //                 }

          //                 if (!cubeContainer.nearMarkers) {
          //                     cubeContainer.nearMarkers = [];
          //                 }

          //                 cubeContainer.nearMarkers.push(
          //                   clonedThingsThatNeedElevation[i]
          //                   );
          //                 clonedThingsThatNeedElevation[i].nearCubes.push(cubeContainer);

          //                 if (dlIndex === 0) {
          //                     if (
          //                       clonedThingsThatNeedElevation[i].marker.position.y >
          //                       cubeContainer.cube.correctedWorldCoords.y +
          //                       halfWorldCubeScale
          //                       ) {
          //                         clonedThingsThatNeedElevation[i].marker.position.y =
          //                         cubeContainer.cube.correctedWorldCoords.y +
          //                         (halfWorldCubeScale * 1.5);
          //                         let translateYValue =
          //                         this.loader.pyrite.modelConfig.markerYOffsets[
          //                           clonedThingsThatNeedElevation[i].TeeId ||
          //                           clonedThingsThatNeedElevation[i].HoleId
          //                           ];
          //                         if (translateYValue) {
          //                             clonedThingsThatNeedElevation[i].marker.position.y
          //                              = translateYValue;
          //                             clonedThingsThatNeedElevation[i].yAdjusted = true;
          //                         }
          //                     }
          //                 }

          //                 clonedThingsThatNeedElevation.splice(i,1);
          //                 i -= 1;
          //             }
          //         }
          //     }
          // });

          // console.log(clonedThingsThatNeedElevation.length);

          // if (dlIndex === 0) {
          //     var hackFix = [];

          //     clonedThingsThatNeedElevation.forEach((something) => {
          //         if (!something.yAdjusted) {
          //             hackFix.push(something);
          //         } else {
          //             if (hackFix.length > 0) {
          //                 console.log('fixing ' + hackFix.length);
          //                 hackFix.forEach((hack) => {
          //                     hack.marker.position.y = something.marker.position.y;
          //                 });
          //                 hackFix = [];
          //             }
          //         }
          //     });
          // }

          // Only call the callback when all levels have been loaded
          loadedLevels += 1;
          if (loadedLevels === vals.length) {
            // Update children relationships for upgrade/downgradeConstant
            vals.forEach((detailLevel) => {
              if (detailLevel.childrenMap) {
                detailLevel.Cubes.forEach((cube) => {
                  const index = `${cube.cube.x}_${cube.cube.y}_${cube.cube.z}`;
                  if (detailLevel.childrenMap[index]) {
                    cube.upgradeChildren = detailLevel.childrenMap[index];
                    cube.upgradeChildren.forEach((child) => {
                      child.downgradeParent = cube;
                      return;
                    });
                    delete detailLevel.childrenMap[index];
                  }
                });
              }
            });
            if (this.debug) console.log(this);
            callback();
          }
        });
      });
    });
  }

  getModelPath(lod, x, y, z) {
    // simple determinate way to assign two servers?  I think this works
    const host = projectConfig.pyriteHosts[x % 2];
    return `${this.versionUrl.replace('api.pyrite3d.org', host)}models/${lod}/${x},${y},${z}`;
  }

  getTexturePath(lod, x, y) {
    return `${this.versionUrl}textures/${lod}/${x},${y}`;
  }

  getNextCubeFactor(lodIndex) {
    if (lodIndex === 0) {
      return new THREE.Vector3(1, 1, 1);
    }
    const currentSetSize = this.DetailLevels[lodIndex].SetSize;
    const nextSetSize = this.DetailLevels[lodIndex - 1].SetSize;
    return new THREE.Vector3(
      nextSetSize.x / currentSetSize.x,
      nextSetSize.y / currentSetSize.y,
      nextSetSize.z / currentSetSize.z
    );
  }

  getPreviousCubeFactor(lodIndex) {
    if (lodIndex === this.DetailLevels.length - 1) {
      return new THREE.Vector3(1, 1, 1);
    }
    const currentSetSize = this.DetailLevels[lodIndex].SetSize;
    const prevSetSize = this.DetailLevels[lodIndex + 1].SetSize;
    return new THREE.Vector3(
      currentSetSize.x / prevSetSize.x,
      currentSetSize.y / prevSetSize.y,
      currentSetSize.z / prevSetSize.z
    );
  }
}

export default PyriteQuery;
