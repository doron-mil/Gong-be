/* eslint-disable operator-linebreak */
const moment = require('moment');
const scheduler = require('node-schedule');
const logger = require('../lib/logger');
const Job = require('../model/job');

let scheduleManagerInstance;

// var list = schedule.scheduledJobs;

class ScheduledJob {
  constructor(/* Job */aJob) {
    this.job = aJob;
    this.schedulerJob = undefined;
  }
}

const scheduleAJob = (/* ScheduledJob */aScheduledJob) => {
  if (scheduleManagerInstance && scheduleManagerInstance.executerFunction) {
    const momentTime = moment(aScheduledJob.job.time);
    momentTime.seconds(0);
    // eslint-disable-next-line no-param-reassign
    aScheduledJob.job.time = momentTime.valueOf();
    return scheduler.scheduleJob(momentTime.toDate(),
      scheduleManagerInstance.executerFunction.bind(null, aScheduledJob.job));
  }
  console.error('ScheduleManager - no execution function was declared');

  return undefined;
};

const dateFormat = 'YY-MM-DD HH:mm';

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
  aTimeKeysArray.sort();
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
      console.error('ScheduledJobsMap.addScheduledJob  ERROR : there is already scheduled job',
        '\nnewRequestedJob = ', aNewScheduledJob.job,
        '\ncurrentScheduledJob = ', this.scheduledJobsMap.get(aNewScheduledJob.job.time));
      return false;
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

  removeJob(/* Job */aJob) {
    const scheduledJobForRemoval = new ScheduledJob(aJob);
    const removedScheduledJob =
      this.scheduledJobsMap.moveScheduledJobFromSchedule(scheduledJobForRemoval, Job.statusEnum.DELETED);
    if (removedScheduledJob && removedScheduledJob.schedulerJob) {
      removedScheduledJob.schedulerJob.cancel();
    }
  }

  addJob(/* Job */aJob) {
    const newScheduledJob = new ScheduledJob(aJob);
    newScheduledJob.schedulerJob = scheduleAJob(newScheduledJob);
    if (newScheduledJob.schedulerJob) {
      this.scheduledJobsMap.addScheduledJob(newScheduledJob);
    } else {
      console.error('ScheduleManager ERROR - Couldn\'t insert a job:',
        newScheduledJob.job.data, ' date :',
        moment(newScheduledJob.job.time)
          .format(dateFormat));
    }
  }

  jobActionFunction(/* Job */aJobOrJobs, aAction = 'ADD') {
    const jobsArray = Array.isArray(aJobOrJobs) ? aJobOrJobs : Array.of(aJobOrJobs);
    if (jobsArray.length <= 0) {
      logger.scheduleManager.warn('ScheduleManager.jobActionFunction - no jobs received.', { action: aAction });
      return;
    }
    logger.scheduleManager.info('ScheduleManager.jobActionFunction',
      { init: (aAction === 'ADD_INIT'), action: aAction, jobs: jobsArray });
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

  addJobsArray(/* Job[] */aJobsArray) {
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
