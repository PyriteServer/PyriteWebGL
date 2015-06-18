var Intersection = (function () {
    function Intersection(hitObject) {
        this.hasHit = false;
        this.hasHit = hitObject != null;
        this.object = hitObject;
        this.position = new THREE.Vector3;
        this.normal = new THREE.Vector3;
        this.ray = new THREE.Ray;
        this.distance = 0.0;
    }
    Intersection.prototype.HasHit = function () {
        return this.hasHit;
    };
    Intersection.prototype.equals = function (otherObject) {
        return JSON.stringify(this) === JSON.stringify(otherObject); // super simple JSON value compare 
    };
    return Intersection;
})();