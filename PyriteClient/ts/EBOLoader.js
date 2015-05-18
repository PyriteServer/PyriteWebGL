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
        var indices = new Int32Array(vertexCount);
        for (var i = 0; i < vertexCount; i++) {
            indices[i] = i;
        }
        //var vertices = new Array<THREE.Vector3>();
        //var normals = new Array<THREE.Vector3>();
        //var uvs = new Array<THREE.Vector2>();
        var positions = new Float32Array(triangleCount * 3 * 3);
        var normals = new Float32Array(triangleCount * 3 * 3);
        var uvs = new Float32Array(triangleCount * 3 * 3);
        var triangles = new Int32Array(vertexCount);
        var normalCalc = new THREE.Vector3();
        var bufferIndex;
        for (var i = 0; i < vertexCount; i++) {
            var nextByte = parser.read("byte");
            switch (nextByte) {
                case 0:
                    bufferIndex = parser.read("uint32");
                    //indices[i] = indices[bufferIndex];
                    triangles[i] = indices[bufferIndex];
                    break;
                case 64:
                    bufferIndex = parser.read("uint32");
                    positions[i] = (positions[indices[bufferIndex]]);
                    p = positions.length - 1;
                    //indices[i] = p;
                    //uvs[i] = (new THREE.Vector2(parser.read("float"), parser.read("float")));
                    uvs[i] = parser.read("float");
                    uvs[i + 1] = parser.read("float");
                    triangles[i] = p;
                    break;
                case 128:
                    break;
                case 255:
                    x = parser.read("float");
                    y = parser.read("float");
                    z = parser.read("float");
                    // calculate the normals
                    normalCalc.set(x, y, z);
                    normalCalc.normalize();
                    normals[i] = normalCalc.x;
                    normals[i + 1] = normalCalc.y;
                    normals[i + 2] = normalCalc.y;
                    positions[i] = x;
                    positions[i + 1] = y;
                    positions[i + 2] = z;
                    p = positions.length - 1;
                    //indices[i] = p;
                    uvs[i] = parser.read("float");
                    uvs[i + 1] = parser.read("float");
                    triangles[i] = p;
                    break;
            }
        }
        //for(
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