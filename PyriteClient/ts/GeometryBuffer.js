var GeometryBuffer = (function () {
    function GeometryBuffer(yOffset, invertedData) {
        if (yOffset === void 0) { yOffset = 0; }
        if (invertedData === void 0) { invertedData = false; }
        this.loader = new EBOLoader();
        this.YOffset = yOffset;
        this.InvertedData = invertedData;
    }
    GeometryBuffer.prototype.Process = function (url, callback) {
        if (this.Processed)
            return;
        this.loader.load(url, false, 0, function (mesh) {
            callback(mesh);
        });
    };
    return GeometryBuffer;
})();
//# sourceMappingURL=GeometryBuffer.js.map