/* eslint-disable operator-linebreak */
const moment = require('moment');
const scheduler = require('node-schedule');

let scheduleManagerInstance;

class ScheduledJob {
  constructor(/* Job */aJob) {
    this.job = aJob;
    this.schedulerJob = undefined;
  }
}

const scheduleAJob = (/* ScheduledJob */scheduledJob) => {
  if (scheduleManagerInstance && scheduleManagerInstance.executerFunction) {
    const momentTime = moment( scheduledJob.job.time );
    momentTime.seconds(0);
    scheduledJob.job.time = momentTime.valueOf();
    return scheduler.scheduleJob(momentTime.toDate(),
      scheduleManagerInstance.executerFunction.bind(null, scheduledJob.job));
  } else {
    console.error('ScheduleManager - no execution function was declared');
  }
  return undefined;
};

const dateFormat = 'YY-MM-DD HH:mm';

const printJobMap = (aJobsMap) => {
  console.log('Map has ', aJobsMap.size, ' items :');
  aJobsMap.forEach((scheduledJob, time) => {
    console.log('date : ', moment(time)
      .format(dateFormat), '  ------>   gong : ', scheduledJob.job.data);
  });
};

class ScheduleManager {
  constructor() {
    this.jobsMap = new Map();
    this.executerFunction = undefined;
  }

  start() {
    console.log('started ScheduleManager');
  }

  setExecuter(aExecuterFunction) {
    this.executerFunction = aExecuterFunction;
  }

  addJob(/* Job */aJob) {
    const newScheduledJob = new ScheduledJob(aJob);
    newScheduledJob.schedulerJob = scheduleAJob(newScheduledJob);
    if (newScheduledJob.schedulerJob) {
      this.jobsMap.set(aJob.time, newScheduledJob);
    } else {
      console.error('ScheduleManager ERROR - Couldn\'t insert a job:',
        newScheduledJob.job.data, ' date :',
        moment(newScheduledJob.job.time).format(dateFormat));
    }
  }

  addJobsArray(/* Job[] */aJobsArray) {
    aJobsArray.forEach(job => {
      this.addJob(job);
    });
    // printJobMap(this.jobsMap);
  }
}

scheduleManagerInstance = new ScheduleManager();
module.exports = scheduleManagerInstance;
