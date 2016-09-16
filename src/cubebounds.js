import Intersection from './intersection.js';

class CubeBounds {
  constructor(container) {
    this.container = container;
  }

  intersects(cubeBounds) {
    if (this.boundingBox.max !== this.boundingBox.min) {
      if (this.boundingBox.isIntersectionBox(cubeBounds.boundingBox)) {
        return new Intersection(this.container);
      }
    }
    return null;
  }
}

export default CubeBounds;
