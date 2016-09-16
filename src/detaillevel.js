import THREE from 'three';
import Cube from './cube.js';
import CubeContainer from './cubecontainer.js';

class PyriteDetailLevel {
    constructor(query, cubeContainerGroup, modelMeshGroup) {
        this.Query = query;
        this.Cubes = [];
        this.cubeContainerGroup = cubeContainerGroup;
        this.modelMeshGroup = modelMeshGroup;
        this.WorldBoundsMin;
        this.WorldBoundsMax;
        this.distance;
        this.UpgradeDistance;
        this.DowngradeDistance;
        this.LODUpperThreshold;
        this.LODLowerThreshold;
        this.worldCenterPos;
        this.upgradeLevel = null;
        this.downgradeLevel = null;
    }

    dispose() {

        this.Cubes.forEach((cube) => {
            cube.dispose();
        });

        delete this.Cubes;

        if (this.downgradeLevel) {
            delete this.downgradeLevel;
        }
        if (this.upgradeLevel) {
            delete this.upgradeLevel;
        }
        delete this.modelMeshGroup;
        delete this.cubeContainerGroup;
        delete this.cubes;
        delete this.Query;
    }

    isHighestLod() {
        return this == this.Query.DetailLevels[0];
    }

    isLowestLod() {
        const largestIndex = this.Query.DetailLevels.length - 1;
        return this == this.Query.DetailLevels[largestIndex];
    }

    addCube(cube) {
        this.Cubes.push(cube);
    }

    cubeExists(x, y, z) {
        return this.Cubes.some((value /*, index, values */) => value.cube.x == x && value.cube.y == y && value.cube.z == z);
    }

    showCube(show, x, y, z) {
        for (let i = 0; i < this.Cubes.length; i++) {
            const cube = this.Cubes[i].cube;
            if (cube.x == x && cube.y == y && cube.z == z) {
            }
        }
    }

    hideCube(x, y, z) {
        for (let i = 0; i < this.Cubes.length; i++) {
            const cube = this.Cubes[i].cube;
            if (cube.x == x && cube.y == y && cube.z == z) {
            }
        }
    }

    hideAllCubes() {
        for (let i = 0; i < this.Cubes.length; i++) {
            this.Cubes[i].hideCube();
        }
    }

    removeCube(x, y, z) {
        for (let i = 0; i < this.Cubes.length; i++) {
            let cube = this.Cubes[i].cube;
            if (cube.x == x && cube.y == y && cube.z == z) {
                this.Cubes.splice(i, 1);
            }
            //cube.destroy();
            cube = null;
        }
    }

    fixWorldCoords() {
        const cubes = this.Cubes;
        for (let i = 0; i < cubes.length; i++) {
            cubes[i].cube.worldCoords = this.GetWorldCoordinatesForCube(cubes[i].cube);
            const worldCoords = cubes[i].cube.worldCoords;

            cubes[i].cube.correctedWorldCoords = new THREE.Vector3(worldCoords.x, worldCoords.z, worldCoords.y * -1.0);
        }
    }

    loadCubeContainers(showPlaceholders) {
        const cubes = this.Cubes;
        for (let i = 0; i < cubes.length; i++) {
            cubes[i].init(this.cubeContainerGroup, this.modelMeshGroup, showPlaceholders);
        }
    }

    TextureCoordinatesForCube(cubeX, cubeY) {
        const textureXPosition = (cubeX / (this.SetSize.x / this.TextureSetSize.x));
        const textureYPosition = (cubeY / (this.SetSize.y / this.TextureSetSize.y));
        return new THREE.Vector2(Math.floor(textureXPosition), Math.floor(textureYPosition));
    }

    GetWorldCoordinatesForCube(cube) {
        return this.GetWorldCoordinatesForCubeCoords(cube.x, cube.y, cube.z);
    }

    GetWorldCoordinatesForCubeVector(vector) {
        return this.GetWorldCoordinatesForCubeCoords(vector.x, vector.y, vector.z);
    }

    GetWorldCoordinatesForCubeCoords(x, y, z) {
        const xPos = this.WorldBoundsMin.x + this.WorldCubeScale.x * x +
            this.WorldCubeScale.x * 0.5;
        const yPos = this.WorldBoundsMin.y + this.WorldCubeScale.y * y +
            this.WorldCubeScale.y * 0.5;
        const zPos = this.WorldBoundsMin.z + this.WorldCubeScale.z * z +
            this.WorldCubeScale.z * 0.5;
        return new THREE.Vector3(xPos, yPos, zPos);
    }

    GetCubeForWorldCoordinates(pos) {
        const cx = ((pos.x - this.WorldBoundsMin.x) / this.WorldCubeScale.x);
        const cy = ((pos.y - this.WorldBoundsMin.y) / this.WorldCubeScale.y);
        const cz = ((pos.z - this.WorldBoundsMin.z) / this.WorldCubeScale.z);
        if (this.cubeExists(cx, cy, cz)) {
            return this.getCube(cx, cy, cz);
        }
        else {
            const cube = new Cube();
            cube.x = cx;
            cube.y = cy;
            cube.z = cz;
            const newContainer = new CubeContainer(this, null, cube);
            newContainer.cube.worldCoords = this.GetWorldCoordinatesForCube(newContainer.cube);
            // newContainer.bounds = new CubeBounds(newContainer);
            newContainer.DetailLevel = this;
            return newContainer;
        }
    }

    getCube(x, y, z) {
        let cube = null;
        this.Cubes.forEach(c => {
            if (c.cube.x == x && c.cube.y == y && c.cube.z == z)
                cube = c;
        });
        return cube;
    }
}

export default PyriteDetailLevel;