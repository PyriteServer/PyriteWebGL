if ('function' === typeof importScripts) {

    importScripts('three.min.js', 'jdataview.js', 'jbinary.js');
    onmessage = function (e) {
        var data = e.data[0];
        var dataView = new jDataView(data, 0, data.length, true);
        var parser = new jBinary(dataView);
        var p, x, y, z;
        var vertexCount = parser.read("uint16") * 3;
        var verticesIndex = new Int32Array(vertexCount);
        var indices = new Uint16Array(vertexCount);
        //var positions = new Float32Array(vertexCount * 3);
        //var uvs = new Float32Array(vertexCount * 2);
        var vertices = new Array();
        var uvsA = new Array();
        var bufferIndex;
        //var positionIndex = 0;
        //var uvIndex = 0;

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
                    var pIndex = verticesIndex[bufferIndex] * 3;
                    //positions[positionIndex] = positions[pIndex];
                    //positions[positionIndex + 1] = positions[pIndex + 1];
                    //positions[positionIndex + 2] = positions[pIndex + 2];
                    //var vector = vertices[verticesIndex[bufferIndex]];
                    //vertices.push(vector);
                    vertices.push(vertices[pIndex]);
                    vertices.push(vertices[pIndex + 1]);
                    vertices.push(vertices[pIndex + 2]);
                    //p = vertices.length - 1;
                    //p = (positionIndex / 3);
                    //positionIndex += 3;
                    p = (vertices.length / 3)-1;
                    verticesIndex[i] = p;
                    
                    var uvX = parser.read("float32");
                    var uvY = parser.read("float32");
                    //uvs[uvIndex] = uvX;
                    //uvs[uvIndex + 1] = uvY;
                    //uvIndex += 2;
                    //var uv = new THREE.Vector2(uvX, uvY);
                    //uvsA.push(uv);
                    uvsA.push(uvX);
                    uvsA.push(uvY);
                    indices[i] = p;
                    break;
                case 128:
                    break;
                case 255:
                    x = parser.read("float32");
                    y = parser.read("float32");
                    z = parser.read("float32");
                    vertices.push(x);
                    vertices.push(y);
                    vertices.push(z);
                    //var vector = new THREE.Vector3(x, y, z);
                    //vertices.push(vector);

                    //positions[positionIndex] = x;
                    //positions[positionIndex + 1] = y;
                    //positions[positionIndex + 2] = z;
                    
                    //p = vertices.length - 1;
                    //p = (positionIndex / 3);
                    //positionIndex += 3;
                    p = (vertices.length / 3)-1;
                    verticesIndex[i] = p;

                    var uvX = parser.read("float32");
                    var uvY = parser.read("float32");
                    uvsA.push(uvX);
                    uvsA.push(uvY);
                    //uvs[uvIndex] = uvX;
                    //uvs[uvIndex + 1] = uvY;
                    //uvIndex += 2;
                    //var uv = new THREE.Vector2(uvX, uvY);
                    //uvsA.push(uv);
                    indices[i] = p;
                    break;
            }
        }
        ////convert vertices to a float array
        //var positions = new Float32Array(vertices.length * 3);
        //for (var i = 0; i < vertices.length; i++) {
        //    var vert = vertices[i];
        //    var index = i * 3;
        //    positions[index] = vert.x;
        //    positions[index + 1] = vert.y;
        //    positions[index + 2] = vert.z;
        //}
        ////convert uvs to a float array
        //var uvs = new Float32Array(uvsA.length * 2);
        //for (var i = 0; i < uvsA.length; i++) {
        //    var uv = uvsA[i];
        //    var index = i * 2;
        //    uvs[index] = uv.x;
        //    uvs[index + 1] = uv.y;
        //}

        var positions = new Float32Array(vertices);
        var uvs = new Float32Array(uvsA);
        var meshData = { indices: indices, positions: positions, uvs: uvs };
        self.postMessage(meshData, [meshData.indices.buffer, meshData.positions.buffer, meshData.uvs.buffer])
    }
}