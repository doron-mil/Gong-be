module.exports = class Job {
  static statusEnum = Object.freeze({
    SCHEDULED: Symbol('SCHEDULED'),
    DONE: Symbol('DONE1'),
    DELETED: Symbol('DELETED'),
    FAILED: Symbol('FAILED'),
  });

  constructor(aTime, aData,aManual=false) {
    this.data = aData;
    this.time = aTime;
    this.isManual = aManual;
    this.status = Job.statusEnum.SCHEDULED;
  }
};
