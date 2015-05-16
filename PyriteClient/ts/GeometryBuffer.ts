class GeometryBuffer {
    Buffer: Uint8Array; // a byte is a 8-bit unsigned int
    Vertices: Array<THREE.Vector3>;
    UVs: Array<THREE.Vector2>;
    Triangles: Int32Array;
    Mesh: THREE.Mesh;
    Processed: boolean;
    YOffset: number;
    InvertedData: boolean;

    private loader: EBOLoader = new EBOLoader();

    constructor(yOffset: number = 0, invertedData: boolean = false) {
        this.YOffset = yOffset;
        this.InvertedData = invertedData;
    }

    Process(url: string, callback) {
        if (this.Processed) return;

        this.loader.load(url, false, 0, (mesh) => {
            callback(mesh);
        });
    }
} 