class EBOLoader {
    crossOrigin: string;
    manager: THREE.LoadingManager;

    constructor(manager?: THREE.LoadingManager) {

    }

    load(url, onLoad, onProgress?, onError?) {

        var scope = this;

        $.ajax({
            url: url,
            type: "GET",
            dataType: 'binary',
            responseType: 'arraybuffer',
            processData: false,
            async: true
        }).done(function (result) {
            onLoad(scope.parse(new Uint8Array(result)));
        });
    }

    parse(data: Uint8Array): THREE.Mesh {
        //var startTime = 
        var dataView = new jDataView(data, 0, data.length, true);
        var parser = new jBinary(dataView);
        var p, x, y, z;

        var vertexCount = parser.read("uint16") * 3;
        var verticesIndex = new Int32Array(vertexCount);
        var indices = new Uint16Array(vertexCount);

        var vertices = new Array<THREE.Vector3>();
        var uvsA = new Array<THREE.Vector2>();

        var bufferIndex;

        for (var i = 0; i < vertexCount; i++) {
            var nextByte = parser.read("byte");
            switch (nextByte) {
                case 0:
                    bufferIndex = parser.read("uint32");
                    verticesIndex[i] = verticesIndex[bufferIndex];
                    indices[i] = verticesIndex[bufferIndex];
                    break;
                case 64:
                    bufferIndex = parser.read("uint32");

                    var vector = vertices[verticesIndex[bufferIndex]];
                    vertices.push(vector);

                    p = vertices.length - 1;
                    verticesIndex[i] = p;

                    var uv = new THREE.Vector2(parser.read("float32"), parser.read("float32"));
                    uvsA.push(uv);

                    indices[i] = p;
                    break;
                case 128:
                    //throw;
                    break;
                case 255:

                    x = parser.read("float32");
                    y = parser.read("float32");
                    z = parser.read("float32");

                    var vector = new THREE.Vector3(x, y, z);
                    vertices.push(vector);

                    p = vertices.length - 1;
                    verticesIndex[i] = p;

                    var uv = new THREE.Vector2(parser.read("float32"), parser.read("float32"));
                    uvsA.push(uv);

                    indices[i] = p;
                    break;
            }
        }

        //convert vertices to a float array
        var positions = new Float32Array(vertices.length * 3);
        for (var i = 0; i < vertices.length; i++) {
            var vert = vertices[i];
            var index = i * 3;
            positions[index] = vert.x;
            positions[index + 1] = vert.y;
            positions[index + 2] = vert.z;
        }

        //convert uvs to a float array
        var uvs = new Float32Array(uvsA.length * 2);
        for (var i = 0; i < uvsA.length; i++) {
            var uv = uvsA[i];
            var index = i * 2;
            uvs[index] = uv.x;
            uvs[index + 1] = uv.y;
        }
       
        return this.createMesh(indices, positions, uvs);
    }

    createMesh(indices: Uint16Array, vertices: Float32Array, uvs: Float32Array): THREE.Mesh {
        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute("index", new THREE.BufferAttribute(indices, 1));
        geometry.addAttribute("position", new THREE.BufferAttribute(vertices, 3));
        geometry.addAttribute("uv", new THREE.BufferAttribute(uvs, 2));
        geometry.computeFaceNormals();
        return new THREE.Mesh(geometry);
    }
} 