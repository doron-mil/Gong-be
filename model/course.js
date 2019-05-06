module.exports = class Course {
  constructor(aTimedGongsArray, aDaysCount, aIsTest = false) {
    this.timedGongsArray = aTimedGongsArray;
    this.daysCount = aDaysCount;
    this.isTest = aIsTest;
  }
}
