var EBOLoader = (function () {
    function EBOLoader(manager) {
    }
    EBOLoader.prototype.load = function (url, onLoad, onProgress, onError) {
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
    };
    EBOLoader.prototype.parse = function (data) {
        var dataView = new jDataView(data, 0, data.length, true);
        var parser = new jBinary(dataView);
        var p, x, y, z;
        var triangleCount = parser.read("uint16");
        var vertexCount = triangleCount * 3;
        var verticesIndex = new Int32Array(vertexCount);
        //var vertices = new Array<THREE.Vector3>();
        //var normals = new Array<THREE.Vector3>();
        //var uvs = new Array<THREE.Vector2>();
        var positions = new Float32Array(triangleCount * 3 * 3);
        var normals = new Float32Array(triangleCount * 3 * 3);
        var uvs = new Float32Array(triangleCount * 3 * 3);
        var indices = new Int32Array(vertexCount);
        //for (var i = 0; i < vertexCount; i++) {
        //    indices[i] = i;
        //}
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
                    positions[i] = (positions[verticesIndex[bufferIndex]]);
                    positions[i + 1] = (positions[verticesIndex[bufferIndex] + 1]);
                    positions[i + 2] = (positions[verticesIndex[bufferIndex] + 2]);
                    p = positions.length - 3;
                    verticesIndex[i] = p;
                    uvs[i] = parser.read("float");
                    uvs[i + 1] = parser.read("float");
                    indices[i] = p;
                    break;
                case 128:
                    break;
                case 255:
                    x = parser.read("float");
                    y = parser.read("float");
                    z = parser.read("float");
                    positions[i] = x;
                    positions[i + 1] = y;
                    positions[i + 2] = z;
                    p = positions.length - 3;
                    verticesIndex[i] = p;
                    uvs[i] = parser.read("float");
                    uvs[i + 1] = parser.read("float");
                    indices[i] = p;
                    break;
            }
        }
        var pa = new THREE.Vector3();
        var pb = new THREE.Vector3();
        var pc = new THREE.Vector3();
        var cb = new THREE.Vector3();
        var ab = new THREE.Vector3();
        for (var i = 0; i < vertexCount; i++) {
            var ax = positions[i];
            var ay = positions[i + 1];
            var az = positions[i + 2];
            var bx = positions[i + 3];
            var by = positions[i + 4];
            var bz = positions[i + 5];
            var cx = positions[i + 6];
            var cy = positions[i + 7];
            var cz = positions[i + 8];
            pa.set(ax, ay, az);
            pb.set(bx, by, bz);
            pc.set(cx, cy, cz);
            cb.subVectors(pc, pb);
            ab.subVectors(pa, pb);
            cb.cross(ab);
            cb.normalize();
            normals[i] = cb.x;
            normals[i + 1] = cb.y;
            normals[i + 2] = cb.z;
            normals[i + 3] = cb.x;
            normals[i + 4] = cb.y;
            normals[i + 5] = cb.z;
            normals[i + 6] = cb.x;
            normals[i + 7] = cb.y;
            normals[i + 8] = cb.z;
        }
        dataView = null;
        parser = null;
        return this.createMesh(indices, positions, uvs, normals);
    };
    EBOLoader.prototype.createMesh = function (indices, vertices, uvs, normals) {
        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute("index", new THREE.BufferAttribute(indices, 1));
        geometry.addAttribute("position", new THREE.BufferAttribute(vertices, 3));
        geometry.addAttribute("normal", new THREE.BufferAttribute(normals, 3));
        geometry.addAttribute("uv", new THREE.BufferAttribute(uvs, 2));
        geometry.computeVertexNormals();
        return new THREE.Mesh(geometry);
    };
    return EBOLoader;
})();
//# sourceMappingURL=EBOLoader.js.map