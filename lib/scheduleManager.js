/* eslint-disable operator-linebreak */
const moment = require('moment');
const scheduler = require('node-schedule');
const logger = require('../lib/logger');
const Job = require('../model/job');

let scheduleManagerInstance;

const errorOnPromisePlusLogger = (aErrMsg) => {
  const newError = new Error(aErrMsg);
  logger.scheduleManager.error(aErrMsg, { error: newError });
  return Promise.reject(newError);
};

const errorPlusLogger = (aErrMsg) => {
  const newError = new Error(aErrMsg);
  logger.scheduleManager.error(aErrMsg, { error: newError });
  return newError;
};

const loggerOutOfError = (aErrMsg, aError) => {
  logger.gongsManager.error(aErrMsg, { error: aError });
};

class ScheduledJob {
  /**
   *
   * @param {module.Job} aJob
   */
  constructor(aJob) {
    this.job = aJob;
    /** @var {Job} */
    this.schedulerJob = undefined;
  }
}

const scheduleAJob = (/* ScheduledJob */aScheduledJob) => {
  if (scheduleManagerInstance && scheduleManagerInstance.executerFunction) {
    const momentTime = moment(aScheduledJob.job.time);
    momentTime.startOf('minute');
    return scheduler.scheduleJob(momentTime.toDate(),
      scheduleManagerInstance.executerFunction.bind(null, aScheduledJob.job));
  }
  throw new Error('ScheduleManager - no execution function was declared');
};

const dateFormat = 'YY-MM-DD HH:mm';
const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss:SSS';

// eslint-disable-next-line no-unused-vars
const printJobMap = (aJobsMap) => {
  console.log('Map has ', aJobsMap.size, ' items :');
  aJobsMap.forEach((scheduledJob, time) => {
    console.log('date : ', moment(time)
      .format(dateFormat), '  ------>   gong : ', scheduledJob.job.data);
  });
};

const addTimeKeyToKeysArray = (aTimeKey, aTimeKeysArray) => {
  aTimeKeysArray.push(aTimeKey);
  aTimeKeysArray.sort((a, b) => b - a);
};

class ScheduledJobsMap {
  constructor() {
    this.scheduledJobsMap = new Map();
    this.scheduledJobsMapKeysArray = [];

    this.obsoleteJobsMap = new Map();
    this.doneJobsMapKeysArray = [];
    this.deletedJobsMapKeysArray = [];
    this.failedJobsMapKeysArray = [];
  }

  addScheduledJob(aNewScheduledJob) {
    if (this.scheduledJobsMapKeysArray.includes(aNewScheduledJob.job.time)) {
      throw new Error('ScheduledJobsMap.addScheduledJob  ERROR : there is already scheduled job',
        '\nnewRequestedJob = ', aNewScheduledJob.job,
        '\ncurrentScheduledJob = ', this.scheduledJobsMap.get(aNewScheduledJob.job.time));
    }
    this.scheduledJobsMap.set(aNewScheduledJob.job.time, aNewScheduledJob);
    addTimeKeyToKeysArray(aNewScheduledJob.job.time, this.scheduledJobsMapKeysArray);

    return true;
  }

  moveScheduledJobFromSchedule(aScheduledJob, aJobStatus = Job.statusEnum.DONE) {
    const scheduledJobTime = aScheduledJob.time;
    const foundScheduledJob = this.scheduledJobsMap.get(scheduledJobTime);
    if (foundScheduledJob) {
      this.scheduledJobsMap.delete(scheduledJobTime);
      foundScheduledJob.job.status = aJobStatus;
      this.obsoleteJobsMap.set(scheduledJobTime, foundScheduledJob);
      this.scheduledJobsMapKeysArray.splice(this.scheduledJobsMapKeysArray.indexOf(scheduledJobTime), 1);
      switch (aJobStatus) {
        case Job.statusEnum.DONE:
          addTimeKeyToKeysArray(scheduledJobTime, this.doneJobsMapKeysArray);
          break;
        case Job.statusEnum.DELETED:
          addTimeKeyToKeysArray(scheduledJobTime, this.deletedJobsMapKeysArray);
          break;
        case Job.statusEnum.FAILED:
          addTimeKeyToKeysArray(scheduledJobTime, this.failedJobsMapKeysArray);
          break;
        default:
          console.error('ScheduledJobsMap.moveScheduledJobFromSchedule  ERROR : couldn\'t ' +
            'find matching status handler for:', aJobStatus);
      }
    }
    return foundScheduledJob;
  }

  getNextScheduledJob() {
    let retScheduledJob = null;
    if (this.scheduledJobsMapKeysArray.length > 0) {
      retScheduledJob = this.scheduledJobsMap.get(this.scheduledJobsMapKeysArray[0]);
    }
    return retScheduledJob;
  }

  printState() {
    const retPrint = `ScheduledJobsMap state is :\n
    scheduledJobsMap - ${this.scheduledJobsMap.size} \n
    scheduledJobsMapKeysArray - ${this.scheduledJobsMapKeysArray.length} \n
    obsoleteJobsMap - ${this.obsoleteJobsMap.size} \n
    doneJobsMapKeysArray - ${this.doneJobsMapKeysArray.length} \n
    deletedJobsMapKeysArray - ${this.deletedJobsMapKeysArray.length} \n
    failedJobsMapKeysArray - ${this.failedJobsMapKeysArray.length} \n    `;
    return retPrint;
  }
}

const executorFunctionWrapper = aExecutorFunction => (aJob, aFireDate) => {
  const executorFunctionSuccess = aExecutorFunction(aJob, aFireDate);
  if (executorFunctionSuccess) {
    scheduleManagerInstance.markJobAsDone(aJob);
  } else {
    scheduleManagerInstance.markJobAsFailed(aJob);
  }
  if (aJob.callBackFunc) {
    aJob.callBackFunc(aJob, aFireDate, executorFunctionSuccess);
  }
};

class ScheduleManager {
  constructor() {
    this.scheduledJobsMap = new ScheduledJobsMap();
    this.executerFunction = undefined;
  }

  start() {
    console.log('started ScheduleManager');
  }

  setExecutor(aExecutorFunction) {
    this.executerFunction = executorFunctionWrapper(aExecutorFunction);
  }

  /**
   *
   * @param {module.Job} aJob4Removal
   */
  removeJob(aJob4Removal) {
    const errorPrefix = 'ScheduleManager.removeJob ERROR.';
    if (!aJob4Removal || !aJob4Removal.time || Number.isNaN(Number(aJob4Removal.time))) {
      const errMsg = `${errorPrefix} Job argument is [partly] empty or invalid`;
      throw errorPlusLogger(errMsg);
    }

    const removedScheduledJob =
      this.scheduledJobsMap.moveScheduledJobFromSchedule(aJob4Removal, Job.statusEnum.DELETED);
    if (removedScheduledJob && removedScheduledJob.schedulerJob) {
      removedScheduledJob.schedulerJob.cancel();
    } else {
      const errMsg = `${errorPrefix} Could not find job : ${JSON.stringify(aJob4Removal)}`;
      throw errorPlusLogger(errMsg);
    }
  }

  /**
   *
   * @param {module.Job} aJob
   */
  addJob(aJob) {
    const errorPrefix = 'ScheduleManager.addJob ERROR.';
    if (!aJob || !aJob.time || Number.isNaN(Number(aJob.time))) {
      const errMsg = `${errorPrefix} Job argument is [partly] empty or invalid`;
      throw errorPlusLogger(errMsg);
    }

    const newScheduledJob = new ScheduledJob(aJob);
    try {
      newScheduledJob.schedulerJob = scheduleAJob(newScheduledJob);
      if (!newScheduledJob.schedulerJob) {
        throw new Error('SchedulerJob returned null');
      }
      this.scheduledJobsMap.addScheduledJob(newScheduledJob);
    } catch (e) {
      if (newScheduledJob.schedulerJob) {
        newScheduledJob.schedulerJob.cancel();
      }
      const stringified = JSON.stringify(aJob);
      const errMsg = `${errorPrefix} Could not add a job : ${stringified}`;
      loggerOutOfError(errMsg, e);
      throw e;
    }
  }

  jobActionFunction(/* Job */aJobOrJobs, aAction = 'ADD') {
    const jobsArray = Array.isArray(aJobOrJobs) ? aJobOrJobs : Array.of(aJobOrJobs);
    if (jobsArray.length <= 0) {
      logger.scheduleManager.warn('ScheduleManager.jobActionFunction - no jobs received.', { action: aAction });
      return;
    }
    logger.scheduleManager.info('ScheduleManager.jobActionFunction',
      {
        init: (aAction === 'ADD_INIT'),
        action: aAction,
        jobs: jobsArray
      });
    jobsArray.forEach((job) => {
      switch (aAction) {
        case 'ADD':
        case 'ADD_INIT':
          this.addJob(job);
          break;
        case 'DELETE':
          this.removeJob(job);
          break;
        case 'UPDATE':
          break;
        default:
          console.error(`Not handeled Action = ${aAction}`);
          break;
      }
    });
  }

  /**
   *
   * @param {module.Job[]} aJobsArray
   */
  addJobsArray(aJobsArray) {
    aJobsArray.forEach((job) => {
      this.addJob(job);
    });
    // printJobMap(this.jobsMap);
  }

  markJobAsDone(/* Job */aJob) {
    this.scheduledJobsMap.moveScheduledJobFromSchedule(aJob, Job.statusEnum.DONE);
  }

  markJobAsFailed(/* Job */aJob) {
    this.scheduledJobsMap.moveScheduledJobFromSchedule(aJob, Job.statusEnum.FAILED);
  }

  getNextScheduledJob() {
    const nextScheduledJob = this.scheduledJobsMap.getNextScheduledJob();
    return nextScheduledJob ? nextScheduledJob.job : null;
  }
}

scheduleManagerInstance = new ScheduleManager();
module.exports = scheduleManagerInstance;
