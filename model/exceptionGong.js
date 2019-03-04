const moment = require('moment');

module.exports = class ExceptionGong {
  constructor(aDayNumber, aTime) {
    this.day_number = aDayNumber;
    this.time = aTime;
  }

  getTotalTimeInMsec() {
    const computedMoment = moment.duration(this.time);
    computedMoment.add(this.day_number, 'd');
    return computedMoment.asMilliseconds();
  }

  static fromJson(aJsonExceptionGongRecord) {
    const newExceptionGong =
      new ExceptionGong(aJsonExceptionGongRecord.day_number, aJsonExceptionGongRecord.time);
    return newExceptionGong;
  }
};
