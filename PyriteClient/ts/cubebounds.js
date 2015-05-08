var CubeBounds = (function () {
    function CubeBounds(cube) {
        this.BoundingBoxHelper = new THREE.BoundingBoxHelper(this.Cube.Obj);
    }
    CubeBounds.prototype.intersects = function (ray) {
        if (this.BoundingBox.maxX != this.BoundingBox.minX && this.BoundingBox.maxY != this.BoundingBox.minY && this.BoundingBox.maxZ != this.BoundingBox.minZ) {
        }
        else if (this.BoundingShere.radius != 0) {
        }
        return null;
    };
    return CubeBounds;
})();
//# sourceMappingURL=cubebounds.js.map