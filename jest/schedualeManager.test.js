const moment = require('moment');
const sinon = require('sinon');
const scheduleManager = require('../lib/scheduleManager');
const Job = require('../model/job');
const logger = require('../lib/logger');

logger.setTestMode();

const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss:SSS';

let successOutput = true;
const mockExecutorFuncForJob = jest.fn((aData, aFireDate) => {
  // console.log('11111', moment(aData.time).format(dateTimeFormat), moment(aFireDate).format(dateTimeFormat));
  return successOutput;
});

const checkForScheduleManagerJobsStatus = (
  aNoOfExpectedJobs = 0, aNoObsolete = 0, aNoDeleted = 0, aNoDone = 0, aNoFailed = 0,
) => {
  const { scheduledJobsMap } = scheduleManager;
  expect(scheduledJobsMap.scheduledJobsMap.size).toBe(aNoOfExpectedJobs);
  expect(scheduledJobsMap.scheduledJobsMapKeysArray.length).toBe(aNoOfExpectedJobs);
  expect(scheduledJobsMap.obsoleteJobsMap.size).toBe(aNoObsolete);
  expect(scheduledJobsMap.doneJobsMapKeysArray.length).toBe(aNoDone);
  expect(scheduledJobsMap.deletedJobsMapKeysArray.length).toBe(aNoDeleted);
  expect(scheduledJobsMap.failedJobsMapKeysArray.length).toBe(aNoFailed);
};

describe('Test scheduleManager', () => {
  let clock;
  let jobsTimeArray = [];
  beforeAll(() => {
    clock = sinon.useFakeTimers(new Date());
  });

  test('Before init', () => {
    const currentMoment = moment();
    currentMoment.add(1, 'hour');
    const job = new Job(currentMoment.valueOf());
    expect(() => scheduleManager.addJob(job)).toThrow();
  });

  test('Initial state', () => {
    checkForScheduleManagerJobsStatus();
  });

  test('Adding false jobs', () => {
    scheduleManager.setExecutor(mockExecutorFuncForJob);
    expect(() => scheduleManager.addJob()).toThrow();

    const job = new Job();

    expect(() => scheduleManager.addJob(job)).toThrow();

    job.time = 'aaaa';

    expect(() => scheduleManager.addJob(job)).toThrow();

    job.time = 4;

    expect(() => scheduleManager.addJob(job)).toThrow();

    job.time = moment().seconds(59);

    expect(() => scheduleManager.addJob(job)).toThrow();

    checkForScheduleManagerJobsStatus();
  });

  test('Adding success jobs', () => {
    const noOfJobs = 50;
    const timeKeysArray = ['y', 'Q', 'M', 'w', 'd', 'h', 'm'];
    const timeKeysCount = timeKeysArray.length;

    for (let i = 0; i < noOfJobs; i++) {
      const selectedKey = timeKeysArray[Math.floor(Math.random() * timeKeysCount)];
      const amountToAdd = 1 + Math.floor(Math.random() * 500);
      const computedMoment = moment().add(amountToAdd, selectedKey).valueOf();
      // const computedMoment = moment('2019-05-15 21:43:52:265',dateTimeFormat);
      if (jobsTimeArray.find(time => moment(time).isSame(computedMoment, 'minute'))) {
        // eslint-disable-next-line no-continue
        continue;
      }
      jobsTimeArray.push(computedMoment);
      const job = new Job(computedMoment);
      scheduleManager.addJob(job);
      // console.log('222222', computedMoment.format(dateTimeFormat));
      checkForScheduleManagerJobsStatus(jobsTimeArray.length);
    }

    const { scheduledJobsMap } = scheduleManager;
    jobsTimeArray.forEach((time) => {
      const scheduledJob = scheduledJobsMap.scheduledJobsMap.get(time);
      expect(scheduledJob).toBeTruthy();
      expect(scheduledJob.job).toBeTruthy();
      expect(scheduledJob.job.time).toEqual(time);
      expect(scheduledJobsMap.scheduledJobsMapKeysArray.includes(time)).toBeTruthy();
      expect(scheduledJob.schedulerJob).toBeTruthy();
      expect(scheduledJob.schedulerJob.nextInvocation().getTime()).toEqual(
        moment(time).startOf('minute').valueOf());
    });
  });

  test('Removing some jobs', () => {
    const initialJobCount = jobsTimeArray.length;
    const momentIn3Years = moment().add(3, 'years').valueOf();
    const filteredJobsTimeArray = jobsTimeArray.filter(time => time >= momentIn3Years);
    const { scheduledJobsMap } = scheduleManager;

    filteredJobsTimeArray.forEach((time, index) => {
      const scheduledJob = scheduledJobsMap.scheduledJobsMap.get(time);
      const job = new Job(time);
      scheduleManager.removeJob(job);
      checkForScheduleManagerJobsStatus(
        initialJobCount - index - 1, index + 1, index + 1
      );
      expect(scheduledJob.schedulerJob.nextInvocation()).not.toBeTruthy();
    });

    jobsTimeArray = jobsTimeArray.filter(time => time < momentIn3Years);
  });

  test('Adding colliding jobs', () => {
    const { scheduledJobsMap } = scheduleManager;
    const initialJobCount = jobsTimeArray.length;
    const initialObsoleteJobCount = scheduledJobsMap.obsoleteJobsMap.size;
    const initialDeletedJobCount = scheduledJobsMap.deletedJobsMapKeysArray.length;

    jobsTimeArray.forEach((time) => {
      const job = new Job(time);
      expect(() => scheduleManager.addJob(job)).toThrow();
      checkForScheduleManagerJobsStatus(initialJobCount, initialObsoleteJobCount, initialDeletedJobCount);
    });
  });

  test('Removing fails', () => {
    const { scheduledJobsMap } = scheduleManager;
    const initialJobCount = jobsTimeArray.length;
    const initialObsoleteJobCount = scheduledJobsMap.obsoleteJobsMap.size;
    const initialDeletedJobCount = scheduledJobsMap.deletedJobsMapKeysArray.length;

    expect(() => scheduleManager.removeJob()).toThrow();
    checkForScheduleManagerJobsStatus(initialJobCount, initialObsoleteJobCount, initialDeletedJobCount);

    const job = new Job();
    expect(() => scheduleManager.removeJob(job)).toThrow();
    checkForScheduleManagerJobsStatus(initialJobCount, initialObsoleteJobCount, initialDeletedJobCount);

    job.time = {};
    expect(() => scheduleManager.removeJob(job)).toThrow();
    checkForScheduleManagerJobsStatus(initialJobCount, initialObsoleteJobCount, initialDeletedJobCount);

    job.time = 'aaa';
    expect(() => scheduleManager.removeJob(job)).toThrow();
    checkForScheduleManagerJobsStatus(initialJobCount, initialObsoleteJobCount, initialDeletedJobCount);

    job.time = 23;
    expect(() => scheduleManager.removeJob(job)).toThrow();
    checkForScheduleManagerJobsStatus(initialJobCount, initialObsoleteJobCount, initialDeletedJobCount);

    job.time = moment().add(1, 'year').valueOf();
    expect(() => scheduleManager.removeJob(job)).toThrow();
    checkForScheduleManagerJobsStatus(initialJobCount, initialObsoleteJobCount, initialDeletedJobCount);
  });

  test('Handling of timed jobs', () => {
    const { scheduledJobsMap } = scheduleManager;
    const initialJobCount = jobsTimeArray.length;
    const initialObsoleteJobCount = scheduledJobsMap.obsoleteJobsMap.size;
    const initialDeletedJobCount = scheduledJobsMap.deletedJobsMapKeysArray.length;

    jobsTimeArray.sort((a, b) => a - b);
    let lastTick = moment().valueOf();
    const newJobsTimeArray = [];
    let noOfDone = 0;
    let noOfFailed = 0;

    jobsTimeArray.forEach((time, index) => {
      if (initialJobCount - index > 2) {
        noOfDone += 1;
      } else {
        successOutput = false;
        noOfFailed += 1;
      }
      const scheduledJob = scheduledJobsMap.scheduledJobsMap.get(time);
      clock.tick(time - lastTick);
      lastTick = time;
      expect(mockExecutorFuncForJob.mock.calls.length).toBe(index + 1);
      expect(mockExecutorFuncForJob.mock.calls[index][0]).toBe(scheduledJob.job);
      expect(mockExecutorFuncForJob.mock.calls[index][1].getTime())
        .toBe(moment(time).startOf('minute').valueOf());
      checkForScheduleManagerJobsStatus(
        initialJobCount - index - 1,
        initialObsoleteJobCount + index + 1,
        initialDeletedJobCount + 0,
        noOfDone + 0,
        noOfFailed + 0,
      );
    });
    jobsTimeArray = newJobsTimeArray;
    // console.log('22222', scheduledJobsMap.printState());
  });
});
