/* eslint no-unused-vars: ["off", { "args": "none" }]*/

class Dictionary {
  constructor(overwrite) {
    this.overwrite = overwrite;
    this.keys = [];
    this.values = [];
  }

  put(key, value) {
    if (!this.overwrite || this.keys.indexOf(key) === -1) {
      this.keys.push(key);
      this.values.push(value);
    }
  }

  get(key) {
    const idx = this.keys.indexOf(key);
    if (idx >= 0) {
      return this.values[idx];
    }

    return null;
  }

  contains(key) {
    const result = this.get(key);

    if (result !== null) {
      return true;
    }

    return false;
  }

  remove(key) {
    const i = this.keys.indexOf(key);
    if (i !== -1) {
      this.keys.splice(i, 1);
      this.values.splice(i, 1);
    }
  }

  clearAll(value) {
    for (let i = 0; i < this.values.length; i += 1) {
      if (this.values[i] === value) {
        this.keys.splice(i, 1);
        this.values.splice(i, 1);
      }
    }
  }

  iterate(func) {
    for (let i = 0; i < this.keys.length; i += 1) {
      func(this.keys[i], this.values[i]);
    }
  }

  length() {
    return this.values.length;
  }
}

export default Dictionary;
