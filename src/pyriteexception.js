class PyriteException {
  constructor(message, source) {
    this.message = message;
    this.source = source || '';
  }

  toString() {
    return `PyriteException: ${this.source}: ${this.message}`;
  }
}

export default PyriteException;
