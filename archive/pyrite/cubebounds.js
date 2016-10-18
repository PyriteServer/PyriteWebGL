var CubeBounds = (function () {
    function CubeBounds(container) {
        this.container = container;
    }
    CubeBounds.prototype.intersects = function (cubeBounds) {
        if (this.boundingBox.max != this.boundingBox.min) {
            if (this.boundingBox.isIntersectionBox(cubeBounds.boundingBox)) {
                return new Intersection(this.container);
            }
        }
        else if (this.boundingShere.radius != 0) {
        }
        return null;
    };
    return CubeBounds;
})();