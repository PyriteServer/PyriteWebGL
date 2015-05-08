class PyriteDetailLevel {
    Name: string;
    Value: number;
    Query: PyriteQuery;
    SetSize: THREE.Vector3;
    TextureSetSize: THREE.Vector2;
    ModelBoundsMin: THREE.Vector3;
    ModelBoundsMax: THREE.Vector3;
    WorldBoundsMax: THREE.Vector3;
    WorldBoundsMin: THREE.Vector3;
    WorldBoundsSize: THREE.Vector3;
    WorldCubeScale: THREE.Vector3;
    Cubes: Array<PyriteCube>;
    Octree: THREE.Octree;

    constructor() {

    }

    TextureCoordinatesForCube(cubeX, cubeY): THREE.Vector2 {
        var textureXPosition = (cubeX / (this.SetSize.x / this.TextureSetSize.x));
        var textureYPosition = (cubeY / (this.SetSize.y / this.TextureSetSize.y)); 
        return new THREE.Vector2(Math.floor(textureXPosition), Math.floor(textureYPosition));
    }

    GetWorldCoordinatesForCube(cube: PyriteCube): THREE.Vector3 {
        var xPos = this.WorldBoundsMin.x + this.WorldCubeScale.x * cube.X +
            this.WorldCubeScale.x * 0.5;
        var yPos = this.WorldBoundsMin.y + this.WorldCubeScale.y * cube.Y +
            this.WorldCubeScale.y * 0.5;
        var zPos = this.WorldBoundsMin.z + this.WorldCubeScale.z * cube.Z +
            this.WorldCubeScale.z * 0.5;
        return new THREE.Vector3(xPos, yPos, zPos);
    }
} 