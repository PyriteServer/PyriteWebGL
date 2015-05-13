class Octree {
    private
    DEFAULT_MIN_SIZE = 1;
    minimumSize: number = this.DEFAULT_MIN_SIZE;
    objects: Array<Object> = new Array(0);
    octants: Array<Octree> = new Array(0);
    insertionQueue: Array<any> = new Array(0);
    region: THREE.Box3;
    parent: Octree;
    treeBuilt: boolean = false;
    treeReady: boolean = false;
    activeOctants: number;

    constructor(region: THREE.Box3) {
        this.region = region;
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

    add(item: any) {
        this.insertionQueue.push(item);
    }

    addMultiple(items: Array<any>) {
        items.forEach((i) => {
            this.insertionQueue.push(i);
        });
    }

    allInstersections(box: THREE.Box3): Array<THREE.Intersection> {
        return null;
    }

    getIntersection(box: THREE.Box3): Array<THREE.Intersection> {
        if (this.objects.length == 0 && !this.hasChildren) {
            return null;
        }

        // handle contains
        if (box.containsBox(this.region)) {

        }

        // handle intersects
        if (box.isIntersectionBox(this.region)) {

        }
    }

    allItems(): Array<any> {
        this.objects.forEach((o) => {
            //yield;
        });

        return null;
    }
}