module.exports = class Job {
  static statusEnum = Object.freeze({
    SCHEDULED: Symbol('SCHEDULED'),
    DONE: Symbol('DONE1'),
    DELETED: Symbol('DELETED'),
    FAILED: Symbol('FAILED'),
  });

  constructor(aTime, aData) {
    this.data = aData;
    this.time = aTime;
    this.status = Job.statusEnum.SCHEDULED;
  }
};
