class EBOLoader {
    crossOrigin: string;
    manager: THREE.LoadingManager;

    constructor(manager?: THREE.LoadingManager) {

    }

    load(url, onLoad, onProgress?, onError?) {

        var scope = this;

        var loader = new THREE.XHRLoader(scope.manager);
        loader.setCrossOrigin(this.crossOrigin);
        loader.load(url, function (text) {

            onLoad(scope.parse(text));

        }, onProgress, onError);
    }

    parse(text: string) {
        var vertexCount;
        tvertices: Array<THREE.Vector3>();
        tuvs: Array<THREE.Vector2>();

        var buffer = new ArrayBuffer(text.length);
        
        var uint16buffer = new Uint16Array(buffer, 0, 1);
        vertexCount = uint16buffer[0] * 3;

        for (var i = 0; i < text.length; i++) {

        }
    }
} 