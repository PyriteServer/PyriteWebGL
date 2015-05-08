var PyriteDetailLevel = (function () {
    function PyriteDetailLevel() {
    }
    PyriteDetailLevel.prototype.TextureCoordinatesForCube = function (cubeX, cubeY) {
        var textureXPosition = (cubeX / (this.SetSize.x / this.TextureSetSize.x));
        var textureYPosition = (cubeY / (this.SetSize.y / this.TextureSetSize.y));
        return new THREE.Vector2(Math.floor(textureXPosition), Math.floor(textureYPosition));
    };
    PyriteDetailLevel.prototype.GetWorldCoordinatesForCube = function (cube) {
        var xPos = this.WorldBoundsMin.x + this.WorldCubeScale.x * cube.X + this.WorldCubeScale.x * 0.5;
        var yPos = this.WorldBoundsMin.y + this.WorldCubeScale.y * cube.Y + this.WorldCubeScale.y * 0.5;
        var zPos = this.WorldBoundsMin.z + this.WorldCubeScale.z * cube.Z + this.WorldCubeScale.z * 0.5;
        return new THREE.Vector3(xPos, yPos, zPos);
    };
    return PyriteDetailLevel;
})();
//# sourceMappingURL=pyritedetaillevel.js.map