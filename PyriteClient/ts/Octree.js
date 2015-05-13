var Octree = (function () {
    function Octree(region) {
        this.DEFAULT_MIN_SIZE = 1;
        this.minimumSize = this.DEFAULT_MIN_SIZE;
        this.objects = new Array(0);
        this.octants = new Array(0);
        this.insertionQueue = new Array(0);
        this.treeBuilt = false;
        this.treeReady = false;
        this.region = region;
    }
    Octree.prototype.hasChildren = function () {
        return this.activeOctants != 0;
    };
    Octree.prototype.isEmpty = function () {
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
    };
    Octree.prototype.isRoot = function () {
        return this.parent != null;
    };
    Octree.prototype.add = function (item) {
        this.insertionQueue.push(item);
    };
    Octree.prototype.addMultiple = function (items) {
        var _this = this;
        items.forEach(function (i) {
            _this.insertionQueue.push(i);
        });
    };
    Octree.prototype.allInstersections = function (box) {
        return null;
    };
    Octree.prototype.getIntersection = function (box) {
        if (this.objects.length == 0 && !this.hasChildren) {
            return null;
        }
        // handle contains
        if (box.containsBox(this.region)) {
        }
        // handle intersects
        if (box.isIntersectionBox(this.region)) {
        }
    };
    Octree.prototype.allItems = function () {
        this.objects.forEach(function (o) {
            //yield;
        });
        return null;
    };
    return Octree;
})();
//# sourceMappingURL=Octree.js.map