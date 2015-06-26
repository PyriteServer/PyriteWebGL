var Config = (function () {
    function Config() {
    }
    //static server: string = "http://pyrite.azurewebsites.net/";
    Config.server = "http://api.pyrite3d.org/";
    //Config.server = "http://pyrite.azurewebsites.net/";
    Config.version = "V2";
    Config.set = "PerthNew";
    Config.lod = 4;
    Config.maxlod = 2;
    Config.fmt = "obj";
    Config.debug = 0;
    Config.showcubes = 0;
    return Config;
})();