const Gong = require('./gong');

module.exports = class ManualGong {
  constructor() {
    this.date = undefined;
    this.isActive = undefined;
    this.gong = new Gong();
  }
}
