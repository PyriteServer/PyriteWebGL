class EBOLoader {
    crossOrigin: string;
    manager: THREE.LoadingManager;

    constructor(manager?: THREE.LoadingManager) {

    }

    load(url, onLoad, onProgress?, onError?) {

        var scope = this;

        //var loader = new THREE.XHRLoader(scope.manager);
        //loader.setCrossOrigin(this.crossOrigin);
        //loader.load(url, function (text) {

        //    onLoad(scope.parse(text));

        //}, onProgress, onError);

        $.ajax({
            url: url,
            type: "GET",
            dataType: 'binary',
            responseType: 'arraybuffer',
            processData: false
        }).done(function (result) {

            onLoad(scope.parse(new Uint8Array(result)));
        });
    }

    parse(data: Uint8Array): THREE.Mesh {
        var dataView = new jDataView(data);
        //var bytes = dataView.getBytes(dataView.byteLength);
        //var parser = new jBinary(bytes);
        var parser = new jBinary(dataView.getBytes(dataView.byteLength));
        var p, x, y, z;

        var vertexCount = parser.read("uint16") * 3;

        var verticesIndex = new Int32Array(vertexCount);
        var vertices = new Array<THREE.Vector3>();
        var uvs = new Array<THREE.Vector2>();
        var triangles = new Int32Array(vertexCount);
        var bufferIndex;

        for (var i = 0; i < vertexCount; i++) {
            var nextByte = parser.read("byte");
            switch (nextByte) {
                case 0:
                    bufferIndex = parser.read("uint32");
                    verticesIndex[i] = verticesIndex[bufferIndex];
                    triangles[i] = verticesIndex[bufferIndex];
                    break;
                case 64:
                    bufferIndex = parser.read("uint32");
                    vertices.push(vertices[verticesIndex[bufferIndex]]);
                    p = vertices.length - 1;
                    verticesIndex[i] = p;
                    uvs.push(new THREE.Vector2(parser.read("float32"), parser.read("float32")));
                    triangles[i] = p;
                    break;
                case 128:
                    //throw;
                    break;
                case 255:

                    x = parser.read("float");
                    y = parser.read("float");
                    z = parser.read("float");

                    vertices.push(new THREE.Vector3(x, y, z));
                    p = vertices.length - 1;
                    verticesIndex[i] = p;
                    uvs.push(new THREE.Vector2(parser.read("float"), parser.read("float")));
                    triangles[i] = p;
                    break;
            }


        }

        return this.createMesh(vertices, uvs);
    }

    createMesh(vertices, uvs): THREE.Mesh {
        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute("vertices", new THREE.BufferAttribute(vertices, 3));
        geometry.addAttribute("uvs", new THREE.BufferAttribute(uvs, 2));
        return new THREE.Mesh(geometry);
    }
} 