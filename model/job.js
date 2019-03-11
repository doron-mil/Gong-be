module.exports = class Job {
  static statusEnum = Object.freeze({
    SCHEDULED: Symbol('SCHEDULED'),
    DONE: Symbol('DONE'),
    DELETED: Symbol('DELETED'),
    FAILED: Symbol('FAILED'),
  });

  constructor(aTime, aData,aManual=false,aCallBackFunc) {
    this.data = aData;
    this.time = aTime;
    this.isManual = aManual;
    this.status = Job.statusEnum.SCHEDULED;
    this.callBackFunc = aCallBackFunc;
  }
};
