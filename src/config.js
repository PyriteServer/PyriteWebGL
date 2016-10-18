/* eslint comma-dangle: ["error", "only-multiline"]*/
class Config {
  constructor() {
    // static server: string = 'http://pyrite.azurewebsites.net/';
    this.server = 'http://api.pyrite3d.org/';
    this.hosts = [
      'pyriteapi.azureedge.net',
      'pyriteapi2.azureedge.net',
    ];
    // Config.server = 'http://pyrite.azurewebsites.net/';
    this.version = 'V7';
    this.set = 'PerthNew';
    this.lod = 5;
    this.maxlod = 1;
    this.fmt = 'ctm';
    this.debug = 0;
    this.showcubes = 0;
    this.useworldbounds = 1;
  }
}

export default Config;
