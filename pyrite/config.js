var Config = (function () {
    function Config() {
    }
    //static server: string = "http://pyrite.azurewebsites.net/";
    Config.server = "http://api.pyrite3d.org/";
    Config.version = "V2";
    Config.set = "PerthNew";
    Config.maxlod = 2;
    Config.fmt = "obj";
    Config.debug = 0;
    return Config;
})();