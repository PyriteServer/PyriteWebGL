import THREE from 'three';
import PyriteQuery from './query.js';
import MicroCache from './microcache.js';
import LRUCache from './lrucache.js';
import PyriteException from './pyriteexception.js';


const LoadType = {};
LoadType.CameraDetection = 0;
LoadType.ThreeByThree = 1;
LoadType[LoadType.CameraDetection] = 'CameraDetection';
LoadType[LoadType.ThreeByThree] = 'ThreeByThree';

class PyriteLoader {
  constructor(p, config) {
    this.config = config;
    this.loadType = LoadType.CameraDetection;
    this.detectionChangeDistance = 0.5;
    this.upgradeConstant = 0.0;
    this.upgradeFactor = 1.05;
    this.downgradeConstant = 0.0;
    this.downgradeFactor = 1.05;
    this.singleLod = false;
    this.pyrite = p;
    this.query = new PyriteQuery(this, this.config);
    // this.camera;
    this.cache = new LRUCache();
    this.textureState = new MicroCache();

    this.activeCubeContainers = [];
    this.inactiveUpgradedCubes = [];
    this.totalLoaded = 0;
    this.totalUnloaded = 0;
    this.totalUpgraded = 0;
    this.totalDowngraded = 0;
    this.lastDebugOutput = Date.now();
    this.debugFrequencyInMS = 3000;
    this.showPlaceholders = false;
    this.cubesToUpgrade = [];
    this.cubesToDowngrade = [];
    this.vf = new THREE.Frustum();
  }

  load(camera, thingsThatNeedElevation, handleLoadCompleted) {
    this.camera = camera;
    this.thingsThatNeedElevation = thingsThatNeedElevation.slice(0);
    this.query.loadAll(() => {
      this.loadInitialCubes();
      handleLoadCompleted();
    }, thingsThatNeedElevation);
  }

  unload() {
    delete this.camera;
    this.thingsThatNeedElevation = null;

    delete this.pyrite;
    delete this.config;


    this.activeCubeContainers.forEach((cc) => {
      cc.unload(true);
    });
    delete this.activeCubeContainers;

    this.cubesToUpgrade.forEach((ctu) => {
      ctu.unload(true);
    });
    delete this.cubesToUpgrade;

    this.cubesToDowngrade.forEach((ctd) => {
      ctd.unload(true);
    });

    delete this.cubesToDowngrade;

    this.query.unload();
    delete this.query;

    delete this.textureState;
    delete this.cache;
    delete this.vf;
    delete this.handleInitialCubesLoaded;
  }

  update(camera) {
    if (this.singleLod) {
      return; // if there is a lod set in the query string, then we won't upgrade
    }

    if (this.query) {
      switch (this.loadType) {
        case LoadType.CameraDetection:
          this.updateCameraDetection(camera);
          break;
        default: throw new PyriteException(`Unsupported LoadType: ${this.loadType}`,
          'PyriteLoader');
      }
    }
  }

  updateCameraDetection(camera) {
    this.loadCubes(camera);
  }


  loadInitialCubes() {
    // Gets the lowest level of detail and adds all it's cubes as the current set of detection cubes
    const lowestLevelOfDetailIndex = this.query.DetailLevels.length - 1;
    const lowestLevelOfDetail = this.query.DetailLevels[lowestLevelOfDetailIndex];
    // lowestLevelOfDetail.loadCubeContainers(this.showPlaceholders);
    this.activeCubeContainers = lowestLevelOfDetail.Cubes.slice(0);
    let expectedLoadedCCs = this.activeCubeContainers.length;
    this.activeCubeContainers.forEach((cc) => {
      cc.init(this.pyrite.cubeDetectorGroup, this.pyrite.modelMeshGroup, this.showPlaceholder);
      cc.load(() => {
        expectedLoadedCCs -= 1;
        if ((expectedLoadedCCs) === 0) {
          this.initialCubesLoaded = true;
          if (this.handleInitialCubesLoaded) {
            this.handleInitialCubesLoaded();
          }
        }
      });
    });
  }

  loadCubes(cameraRig) {
    if (!this.initialCubesLoaded) {
      return;
    }

    const camera = cameraRig.children[0];

    this.vf.setFromMatrix(camera.projectionMatrix.clone().multiply(camera.matrixWorldInverse));
    let cubesWithParents = 0;
    let cubesWithParentsWithMesh = 0;
    let cubesWithParentsWithoutMesh = 0;
    let cubesCanDowngrade = 0;

    for (let i = 0; i < this.activeCubeContainers.length; i += 1) {
      const activeCubeContainer = this.activeCubeContainers[i];
      activeCubeContainer.canDowngrade = false;
      const distance = cameraRig.position.distanceTo(activeCubeContainer.placeholderMesh.position);
      let downgradeDistance = null;

      // Calculate downgrade distance (if possible)
      if (activeCubeContainer.downgradeParent) {
        cubesWithParents += 1;
        if (activeCubeContainer.downgradeParent.placeholderMesh) {
          cubesWithParentsWithMesh += 1;
          downgradeDistance = cameraRig.position.distanceTo(
            activeCubeContainer.downgradeParent.placeholderMesh.position
          );
        } else {
          cubesWithParentsWithoutMesh += 1;
          downgradeDistance = -1;
          throw new PyriteException('ERROR: Parent exists without placeholder mesh', 'PyriteLoader');
        }
      }

      let upgradingEnabled = true;

      if (this.isUpgradingEnabled) {
        upgradingEnabled = this.isUpgradingEnabled();
      }

      if (upgradingEnabled &&
        activeCubeContainer.detailLevel.upgradeLevel &&
        distance < activeCubeContainer.detailLevel.UpgradeDistance) {
        // Cube can be upgrade (i.e. Replaced with higher detailed (smaller) cubes)
        this.totalUpgraded += 1;
        activeCubeContainer.upgraded = true;
        activeCubeContainer.upgrading = true;
        this.cubesToUpgrade.push(activeCubeContainer);
        activeCubeContainer.upgradeChildren.forEach((child) => {
          child.init(this.pyrite.cubeDetectorGroup, this.pyrite.modelMeshGroup, null);
          if (this.showPlaceholders) child.showPlaceholder();
          child.canDowngrade = false;
          this.activeCubeContainers.push(child);
        });
        if (this.showPlaceholders) activeCubeContainer.hidePlaceholder();
        this.activeCubeContainers.splice(i, 1);
        i -= 1;
      } else if (downgradeDistance &&
        (downgradeDistance > activeCubeContainer.downgradeParent.detailLevel.DowngradeDistance ||
          downgradeDistance === -1)
      ) {
        // Cube is far enough away to be downgraded if possible
        // Downgrading depends on if all children of the lower resolution cube are far enough away
        cubesCanDowngrade += 1;
        activeCubeContainer.canDowngrade = true;

        if (this.pyrite.debugStats) {
          activeCubeContainer.downgradeParent.upgradeChildren.forEach((sibling) => {
            if (!sibling.upgraded && this.activeCubeContainers.indexOf(sibling) === -1) {
              throw new PyriteException('ERROR: A sibling cube is not in the active cube list.',
                'PyriteLoader');
            }
          });
        }
      }

      if (activeCubeContainer.canDowngrade &&
        activeCubeContainer.downgradeParent.upgradeChildren.every(
          sibling => sibling.canDowngrade)
      ) {
        if (activeCubeContainer.downgradeParent.upgrading) {
          // The parent was upgrading (waiting for some children). But now should be added back
          const indexOfParent = this.cubesToUpgrade.indexOf(activeCubeContainer.downgradeParent);

          if (indexOfParent === -1) {
            throw new PyriteException(
              'Unexpected Condition - downgrade parent was upgrading but not in upgrade list.',
              'PyriteLoader');
          }
          activeCubeContainer.downgradeParent.upgrading = false;
          this.cubesToUpgrade.splice(indexOfParent, 1);
        }

        // If this cube was downgradable and all its siblings are downgradable then we can bring
        //  back the lower detailed (and larger) parent cube
        this.totalDowngraded += 1;
        activeCubeContainer.downgradeParent.upgradeChildren.forEach((sibling) => {
          // The parent placeholder is active so we can remove this from active list
          //  (and remove placeholder (deinit))
          const indexOfCubeToDowngrade = this.activeCubeContainers.indexOf(sibling);
          if (indexOfCubeToDowngrade !== -1) {
            this.activeCubeContainers.splice(indexOfCubeToDowngrade, 1);
            if (this.showPlaceholders) sibling.hidePlaceholder();
            sibling.deinit();
          } else {
            throw new PyriteException('ERROR: Sibling was not in the active container list',
              'PyriteLoader');
          }
        });

        this.cubesToDowngrade =
          this.cubesToDowngrade.concat(activeCubeContainer.downgradeParent.upgradeChildren);
        if (this.showPlaceholders) activeCubeContainer.downgradeParent.showPlaceholder();
        activeCubeContainer.downgradeParent.canDowngrade = false;
        activeCubeContainer.downgradeParent.upgraded = false;

        this.activeCubeContainers.push(activeCubeContainer.downgradeParent);
      } else if (!activeCubeContainer.upgrading) {
        // Eligible for loading
        // Check for intersection
        if (this.vf.intersectsObject(activeCubeContainer.placeholderMesh)) {
          if (!activeCubeContainer.isLoaded && !activeCubeContainer.isLoading) {
            this.totalLoaded += 1;
            activeCubeContainer.load();
          }
        } else if (activeCubeContainer.isLoaded || activeCubeContainer.isLoading) {
          this.totalUnloaded += 1;
          activeCubeContainer.unload();
        }
      }
    }

    // For cubes that are being upgraded remove their model only when ALL their children are
    //   either:
    //     - upgraded
    //     - model loaded
    //     - neither (no upgraded and not in camera)
    for (let i = 0; i < this.cubesToUpgrade.length; i += 1) {
      const cubeToUpgrade = this.cubesToUpgrade[i];
      if (cubeToUpgrade.upgradeChildren.every(child => !child.upgrading && !child.isLoading)) {
        if (cubeToUpgrade.isLoaded || cubeToUpgrade.isLoading) {
          this.totalUnloaded += 1;
          cubeToUpgrade.unload();
        }
        cubeToUpgrade.upgrading = false;
        this.cubesToUpgrade.splice(i, 1);
        i -= 1;
      }
    }

    for (let i = 0; i < this.cubesToDowngrade.length; i += 1) {
      const cubeToDowngrade = this.cubesToDowngrade[i];
      cubeToDowngrade.downgrading = true;
      // If the parent is loaded then we can remove this model
      if (!cubeToDowngrade.downgradeParent.isLoading) {
        if (cubeToDowngrade.isLoaded || cubeToDowngrade.isLoading) {
          this.totalUnloaded += 1;
          cubeToDowngrade.unload();
        }
        cubeToDowngrade.downgrading = false;
        this.cubesToDowngrade.splice(i, 1);
        i -= 1;
      }
    }

    if (this.pyrite.debugStats && (Date.now() - this.lastDebugOutput > this.debugFrequencyInMS)) {
      // console.log(`ActiveCubeCount: ${this.activeCubeContainers.length}`);
      // console.log(`CubesToUpgrade: ${this.cubesToUpgrade.length},\
      //               CubesToDowngrade: ${this.cubesToDowngrade.length}`
      // );
      // console.log(`TextureCacheSize: ${this.cache.length()} \
      //               TextureStateSize: ${this.textureState.length()}`
      // );
      this.lastDebugOutput = Date.now();
      this.pyrite.statsContainer.innerHTML = `ACCs: ${this.activeCubeContainers.length}, \
                                              CTD: ${this.cubesToDowngrade.length}, \
                                              CTU: ${this.cubesToUpgrade.length}, \
                                              CWP: ${cubesWithParents}, \
                                              CWPWM: ${cubesWithParentsWithMesh}, \
                                              CWPWOM: ${cubesWithParentsWithoutMesh}, \
                                              CCD: ${cubesCanDowngrade}`;
      this.pyrite.statsContainer.innerHTML += '<br/>';
      this.pyrite.statsContainer.innerHTML += `TotalLoaded: ${this.totalLoaded}, \
                                               TotalUnloaded: ${this.totalUnloaded}, \
                                               TotalUpgraded: ${this.totalUpgraded}, \
                                               TotalDowngraded: ${this.totalDowngraded}`;
    }
  }
}

export default PyriteLoader;
