class Config {
  constructor() {
        // static server: string = 'http://pyrite.azurewebsites.net/';
    this.server = 'http://api.pyrite3d.org/';
        // Config.server = 'http://pyrite.azurewebsites.net/';
    this.version = 'V2';
    this.set = 'PerthNew';
    this.lod = 4;
    this.maxlod = 1;
    this.fmt = 'ctm';
    this.debug = 0;
    this.showcubes = 0;
    this.useworldbounds = 1;
  }
}

export default Config;
