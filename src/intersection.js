import THREE from 'three';

class Intersection {
  constructor(hitObject) {
    this.hasHit = false;
    this.hasHit = hitObject != null;
    this.object = hitObject;
    this.position = new THREE.Vector3();
    this.normal = new THREE.Vector3();
    this.ray = new THREE.Ray();
    this.distance = 0.0;
  }

  HasHit() {
    return this.hasHit;
  }

  equals(otherObject) {
    return JSON.stringify(this) === JSON.stringify(otherObject); // super simple JSON value compare
  }
    }

export default Intersection;
