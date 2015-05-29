class Octree {
    private
    DEFAULT_MIN_SIZE = 1;
    minimumSize: number = this.DEFAULT_MIN_SIZE;
    objects: Array<THREE.Mesh> = new Array(0);
    octants: Array<Octree> = new Array(0);
    insertionQueue: Array<THREE.Mesh> = new Array(0);
    region: THREE.Box3;
    parent: Octree;
    treeBuilt: boolean = false;
    treeReady: boolean = false;
    activeOctants: number;

    private debruijnPosition: Uint32Array = new Uint32Array([
         0, 9, 1, 10, 13, 21, 2, 29, 11, 14, 16, 18, 22, 25, 3, 30, 8, 12, 20, 28, 15, 17, 24, 7, 19, 27, 23, 6, 26,
        5, 4, 31]);

    private bitCheck: Uint32Array = new Uint32Array([ 0x07C4ACDD ]);

    constructor() {
        this.region = new THREE.Box3();
    }

    hasChildren(): boolean {
        return this.activeOctants != 0;
    }

    isEmpty(): boolean {
        if (this.objects.length != 0)
            return false;

        if (this.activeOctants != 0) {
            for (var a = 0; a < 8; a++) {
                if (this.octants[a] != null && !this.octants[a].isEmpty()) {
                    return false;
                }
            }
        }

        return true;
    }

    isRoot(): boolean {
        return this.parent != null;
    }

    add(item: THREE.Mesh) {
        this.insertionQueue.push(item);
    }

    addMultiple(items: Array<THREE.Mesh>) {
        items.forEach((i) => {
            this.insertionQueue.push(i);
        });
    }

    insert(item: THREE.Mesh) {
        if (this.objects.length <= 1 && this.activeOctants == 0) {
            this.objects.push(item);
            return;
        }

        var dimensions = this.region.max.sub(this.region.min);
        if (dimensions.x <= this.minimumSize && dimensions.y <= this.minimumSize && dimensions.z <= this.minimumSize) {
            this.objects.push(item);
            return;
        }

        var half = dimensions.divideScalar(2.0);
        var center = this.region.min.add(half);
        var childOctant = new Array<THREE.Box3>(8);
        childOctant[0] = (this.octants[0] != null) ? this.octants[0].region : new THREE.Box3(this.region.min, center);
        childOctant[1] = (this.octants[1] != null)
            ? this.octants[1].region
            : new THREE.Box3(new THREE.Vector3(center.x, this.region.min.y, this.region.min.z), new THREE.Vector3(this.region.max.x, center.x, center.z));
        childOctant[2] = (this.octants[2] != null)
            ? this.octants[2].region
            : new THREE.Box3(new THREE.Vector3(center.x, this.region.min.y, center.z), new THREE.Vector3(this.region.max.x, center.x, this.region.max.z));
        childOctant[3] = (this.octants[3] != null)
            ? this.octants[3].region
            : new THREE.Box3(new THREE.Vector3(this.region.min.x, this.region.min.y, center.z), new THREE.Vector3(center.x, center.x, this.region.max.z));
        childOctant[4] = (this.octants[4] != null)
            ? this.octants[4].region
            : new THREE.Box3(new THREE.Vector3(this.region.min.x, center.x, this.region.min.z), new THREE.Vector3(center.x, this.region.max.y, center.z));
        childOctant[5] = (this.octants[5] != null)
            ? this.octants[5].region
            : new THREE.Box3(new THREE.Vector3(center.x, center.x, this.region.min.z), new THREE.Vector3(this.region.max.x, this.region.max.y, center.z));
        childOctant[6] = (this.octants[6] != null) ? this.octants[6].region : new THREE.Box3(center, this.region.max);
        childOctant[7] = (this.octants[7] != null)
            ? this.octants[7].region
            : new THREE.Box3(new THREE.Vector3(this.region.min.x, center.x, center.z), new THREE.Vector3(center.x, this.region.max.y, this.region.max.z));

        if (item.geometry.boundingBox.max != item.geometry.boundingBox.min && this.region.containsBox(item.geometry.boundingBox)) {
            var found = false;

            for (var i = 0; i < 8; i++) {
                if (childOctant[i].containsBox(item.geometry.boundingBox)){
                    if (this.octants[i]) {
                        this.octants[i].insert(item);
                    } else {
                        this.octants[i] = this.createNode(childOctant[i], [item]);
                        this.activeOctants |= (1 << i);
                    }
                    found = true;
                }
            }
            if (!found) {
                this.objects.push(item);
            }

        } else {
            this.build();
        }
    }

    nextPowerOfTwo(v) {
        // first round down to one less than a power of 2
        v |= v >> 1;
        v |= v >> 2;
        v |= v >> 4;
        v |= v >> 8;
        v |= v >> 16;

        // Debruijn sequence to find most significant bit position
        // this is 0x07C4ACDDU in c#
        var r = this.debruijnPosition[(v * 0x07C4ACDD) >> 27];

        // Shift MSB left to find next power 2.
        return 1 << (r + 1);
    }

    setEnclosingBox() {
        var globalMin = this.region.min;
        var globalMax = this.region.max;

        for (var i = 0; i < this.objects.length; i++) {

            var obj = this.objects[i];

            var localMin = new THREE.Vector3();
            var localMax = new THREE.Vector3();

            if (obj.geometry.boundingBox.max != obj.geometry.boundingBox.min) {
                localMin = obj.geometry.boundingBox.min;
                localMax = obj.geometry.boundingBox.max;
            }

            if (localMin.x < globalMin.x) {
                globalMin.x = localMin.x;
            }
            if (localMin.y < globalMin.y) {
                globalMin.y = localMin.y;
            }
            if (localMin.z < globalMin.z) {
                globalMin.z = localMin.z;
            }

            if (localMax.x > globalMax.x) {
                globalMax.x = localMax.x;
            }
            if (localMax.y > globalMax.y) {
                globalMax.y = localMax.y;
            }
            if (localMax.z > globalMax.z) {
                globalMax.z = localMax.z;
            }
        }

        this.region.min = globalMin;
        this.region.max = globalMax;
    }

    setEnclosingCube() {
        this.setEnclosingBox();

        //find the min offset from (0,0,0) and translate by it for a short while
        var offset = this.region.min.sub(new THREE.Vector3());
        this.region.min.add(offset);
        this.region.max.add(offset);

        //find the nearest power of two for the max values
        var highX = Math.floor(Math.max(Math.max(this.region.max.x, this.region.max.y), this.region.max.z));

        //see if we're already at a power of 2
        for (var bit = 0; bit < 32; bit++)
        {
            if (highX == 1 << bit) {
                this.region.max = new THREE.Vector3(highX, highX, highX);

                this.region.min.sub(offset);
                this.region.max.sub(offset);
                return;
            }
        }

        //gets the most significant bit value, so that we essentially do a Ceiling(X) with the 
        //ceiling result being to the nearest power of 2 rather than the nearest integer.
        var x = this.nextPowerOfTwo(highX);

        this.region.max = new THREE.Vector3(x, x, x);

        this.region.min.sub(offset);
        this.region.max.sub(offset);
    }

    createNode(region: THREE.Box3, items: Array<THREE.Mesh>): Octree {
        var ret = new Octree();
        ret.minimumSize = this.minimumSize;
        ret.region = region;
        ret.parent = this;
        ret.addMultiple(items);

        return ret;
    }

    allInstersections(box: THREE.Box3): Array<THREE.Intersection> {
        if (!this.treeReady) {
            this.update();
        }

        return this.getIntersection(box);
    }

    getIntersection(box: THREE.Box3): Array<THREE.Intersection> {
        if (this.objects.length == 0 && !this.hasChildren) {
            return null;
        }

        // handle contains
        if (box.containsBox(this.region)) {
            var intersections = new Array<THREE.Intersection>(this.allItems.length);
            for (var i = 0; i < intersections.length; i++){
                var intersection = intersections[i];
                var object = this.objects[i];

                //intersection.object = object;

            };
        }

        // handle intersects
        if (box.isIntersectionBox(this.region)) {
            
        }
    }

    allItems(): Array<THREE.Box3> {
        this.objects.forEach((o) => {
            //yield;
        });

        return null;
    }

    update() {
        if (!this.treeBuilt) {
            while (this.insertionQueue.length != 0) {
                this.objects.push(this.insertionQueue.pop());
            }
            this.build();
        } else {
            while (this.insertionQueue.length != 0) {
                this.insert(this.insertionQueue.pop());
            }
        }

        this.treeReady = true;
    }

    build() {
        if (this.objects.length <= 1) {
            return;
        }

        var dimensions = this.region.max.sub(this.region.min);
        var zero = new THREE.Vector3();

        if (dimensions == zero) {
            this.setEnclosingCube();
            dimensions = this.region.max.sub(this.region.min);
        }

        //Check to see if the dimensions of the box are greater than the minimum dimensions
        if (dimensions.x <= this.minimumSize && dimensions.y <= this.minimumSize && dimensions.z <= this.minimumSize) {
            return;
        }

        var half = dimensions.divideScalar(2.0);
        var center = this.region.min.add(half);

        var octant = new Array<THREE.Box3>(8);
        octant[0] = new THREE.Box3(this.region.min, center);
        octant[1] = new THREE.Box3(new THREE.Vector3(center.x, this.region.min.y, this.region.min.z), new THREE.Vector3(this.region.max.x, center.x, center.z));
        octant[2] = new THREE.Box3(new THREE.Vector3(center.x, this.region.min.y, center.z), new THREE.Vector3(this.region.max.x, center.x, this.region.max.z));
        octant[3] = new THREE.Box3(new THREE.Vector3(this.region.min.x, this.region.min.y, center.z), new THREE.Vector3(center.x, center.x, this.region.max.z));
        octant[4] = new THREE.Box3(new THREE.Vector3(this.region.min.x, center.x, this.region.min.z), new THREE.Vector3(center.x, this.region.max.y, center.z));
        octant[5] = new THREE.Box3(new THREE.Vector3(center.x, center.x, this.region.min.z), new THREE.Vector3(this.region.max.x, this.region.max.y, center.z));
        octant[6] = new THREE.Box3(center, this.region.max);
        octant[7] = new THREE.Box3(new THREE.Vector3(this.region.min.x, center.x, center.z), new THREE.Vector3(center.x, this.region.max.y, this.region.max.z));

        var octList = new Array<Array<THREE.Mesh>>(8);

        for (var i = 0; i < 8; i++) {
            octList[i] = new Array<THREE.Mesh>();
        }

        var delist = new Array<THREE.Mesh>();

        for (var o = 0; o < this.objects.length; o++) {
            var obj = this.objects[i];

            if (obj.geometry.boundingBox.min != obj.geometry.boundingBox.max) {
                for (var a = 0; a < 8; a++)
                {
                    if (octant[a].containsBox(obj.geometry.boundingBox)) {
                        octList[a].push(obj);
                        delist.push(obj);
                        break;
                    }
                }
            }
        }

        for (var d = 0; d < delist.length; d++) {
            //this.objects.
        }

        //Create child nodes where there are items contained in the bounding region
        for (var a = 0; a < 8; a++)
        {
            if (octList[a].length != 0) {
                this.octants[a] = this.createNode(octant[a], octList[a]);
                this.activeOctants |= (1 << a);
                this.octants[a].build();
            }
        }

        this.treeBuilt = true;
        this.treeReady = true;
    }
}