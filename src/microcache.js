/**
 * Micro Cache
 * - a micro library to handle a inmemory cache
 * - works in node and browser.
 *
 * @tags inmemory, keyvalue, cache, node, browser
*/

class MicroCache {
  constructor() {
    this.values = {};
    this.length = 0;
  }

  get(key) {
    return this.values[key];
  }

  contains(key) {
    return key in this.values;
  }

  remove(key) {
    delete this.values[key];
    this.length -= 1;
  }

  set(key, value) {
    if (!this.contains(key)) {
      this.length += 1;
    }
    this.values[key] = value;
  }

  values() {
    return this.values;
  }

  length() {
    return this.length;
  }

  getSet(key, value) {
    if (!this.contains(key)) {
      this.set(key, typeof value === 'function' ? value() : value);
    }
    return this.get(key);
  }
}

export default MicroCache;
