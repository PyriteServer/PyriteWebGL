# PyriteWebGL

Prototype WebGL client for [Pyrite3d](http://www.pyrite3d.org/)

- Uses [ThreeJS](https://threejs.org/)

## Install

```
npm install --save pyrite3dwebgl
```


## Usage

```js
import Pyrite from 'pyrite3dwebgl';

const pyrite = new Pyrite(container, id, config);
pyrite.start();
```


## Development

### Release Steps

Run the following from the package root
1. `npm install`
1. `npm run prerelease`
1. Update CHANGELOG.md
1. `npm version patch` (or whatever version change makes sense)
1. `npm publish`

