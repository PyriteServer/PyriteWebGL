/// <reference path="./three.d.ts" />

declare module THREE {
    class Octree {
        constructor(...parameters: any[]);

        update();
        add(object, options);
        addDeferred(object, options);
        addObjectData(object, part);
        remove(object);
        extend(octree);
        rebuild();
        updateObject(object);
        search(position, radius, organizeByObject, direction): any;
        setRoot(root);
        getDepthEnd();
    }
}
