const Gong = require('./gong');

module.exports = class ManualGong {
  constructor(aTime, aGong = new Gong(), aIsActive = true) {
    this.time = aTime;
    this.isActive = aIsActive;
    this.gong = aGong;
  }

  cloneWhileAddingTime(addedTime) {
    const newManualGong = new ManualGong(this.time + addedTime, this.gong, this.isActive);
    return newManualGong;
  }
};
