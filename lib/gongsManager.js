const fs = require('fs');
const moment = require('moment');

const jsonClassConverter = require('./jsonConverter');

const logger = require('./logger');
const utilsManager = require('./utilsManager');

const Job = require('../model/job');
const CourseSchedule = require('../model/courseSchedule');
const ExceptionGong = require('../model/exceptionGong');

let gongsManagerInstance;

const timedGongsCompareFunc = (a, b) => a.time - b.time;
const dateFormat = 'YYYY-MM-DD';
const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss:SSS';

const errorOnPromisePlusLogger = (aErrMsg) => {
  const newError = new Error(aErrMsg);
  logger.gongsManager.error(aErrMsg, { error: newError });
  return Promise.reject(newError);
};

const errorPlusLogger = (aErrMsg) => {
  const newError = new Error(aErrMsg);
  logger.gongsManager.error(aErrMsg, { error: newError });
  return newError;
};

const loggerOutOfError = (aErrMsg, aError) => {
  logger.gongsManager.error(aErrMsg, { error: aError });
};

/**
 *
 * @param {module.Job} aJob
 */
const removeJobFromLists = (aJob) => {
  const errorPrefix = 'GongsManager::removeJobFromLists ERROR.';
  if (aJob.isManual) {
    // eslint-disable-next-line no-use-before-define
    cleanManualGongs();
  } else {
    const coursesTimeArray = Array.from(gongsManagerInstance.automaticGongsMap.keys());
    if (coursesTimeArray && coursesTimeArray.length > 0) {
      coursesTimeArray.sort((a, b) => a - b);
      const currentCourseId = coursesTimeArray[0];
      const scheduledCourseJobsArray = gongsManagerInstance.automaticGongsMap.get(currentCourseId);
      const foundIndex =
        scheduledCourseJobsArray.findIndex((scheduledCourseJob) => scheduledCourseJob.time === aJob.time);
      if (foundIndex >= 0) {
        scheduledCourseJobsArray.splice(foundIndex, 1);
      } else {
        const errMsg = `${errorPrefix} Failed to find the specified job: ${JSON.stringify(aJob)}`;
        errorPlusLogger(errMsg);
      }
      if (scheduledCourseJobsArray.length <= 0) {
        const foundCourseIndex = gongsManagerInstance.scheduledCoursesArray.findIndex(
          (scheduledCourse) => scheduledCourse.id === currentCourseId
        );
        if (foundCourseIndex >= 0) {
          const foundCourse = gongsManagerInstance.scheduledCoursesArray.splice(foundCourseIndex, 1)[0];
          gongsManagerInstance.passedCoursesArray.push(foundCourse);
          gongsManagerInstance.automaticGongsMap.delete(currentCourseId);
          // eslint-disable-next-line no-use-before-define
          cleanScheduleCourses();
          logger.gongsManager.info(
            `GongsManager::removeJobFromLists ; course has ended  ${JSON.stringify(foundCourse)}`,
          );
        } else {
          const errMsg = `${errorPrefix} Failed to find the specified course: ${currentCourseId}`;
          errorPlusLogger(errMsg);
        }
      }
    }
  }
};

const gongManagerCallBackFunc = (aJob, aFireDate, aExecutedSuccess) => {
  const firedTime = moment(aFireDate)
    .format(dateTimeFormat);
  removeJobFromLists(aJob);
  logger.gongsManager.info(`GongManager.CallBackFunc ; time : ${firedTime}; Was Successful : ${aExecutedSuccess}`,
    { jobs: aJob });
};

const createNewJob = (aTime, aData, aIsManual = false) => {
  const newJob = new Job(aTime, aData, aIsManual, gongManagerCallBackFunc);
  return newJob;
};

const activateGongListenersForJobOrJobs = (aJobOrJobs, aAction = 'ADD') => {
  if (!aJobOrJobs || (Array.isArray(aJobOrJobs) && aJobOrJobs.length <= 0)) {
    logger.gongsManager.warn(`GongManager.activateGongListenersForJob - No Jobs for action : ${aAction}`);
    return;
  }
  gongsManagerInstance.onGongActionListenersArray.forEach((listener) => listener(aJobOrJobs, aAction));
};

const activateGongListeners = (aTime, aData, aAction, aIsManual) => {
  const newJob = createNewJob(aTime, aData, aIsManual);
  activateGongListenersForJobOrJobs(newJob, aAction);
};

const checkCourseCollision = (/* moment */aSubjectCourseStartDate, /* moment */aSubjectCourseEndDate) => {
  const errorPrefix = 'GongsManager.checkCourseCollision ERROR.';
  if (!aSubjectCourseStartDate || !aSubjectCourseEndDate
    || !aSubjectCourseStartDate.isValid() || !aSubjectCourseEndDate.isValid()) {
    const errMsg = `${errorPrefix} Start date and End date params must be valid moments objects`;
    throw errorPlusLogger(errMsg);
  }
  const retValue = gongsManagerInstance.scheduledCoursesArray.some((/* CourseSchedule */scheduledCourse) => {
    const courseName = scheduledCourse.course_name;
    const course = utilsManager.coursesMap.get(courseName);
    if (!course) {
      const errMsg = `${errorPrefix} Mailfunction : can't get course for name : '${courseName}'`;
      throw errorPlusLogger(errMsg);
    }
    const scheduledCourseStart = moment(scheduledCourse.date, dateFormat);
    const scheduledourseStartDay = scheduledCourse.startFromDay ? scheduledCourse.startFromDay : 0;
    const scheduledCourseEnd = scheduledCourseStart.clone().add(course.daysCount - scheduledourseStartDay - 1, 'd');

    if (!scheduledCourseStart || !scheduledCourseEnd ||
      !scheduledCourseStart.isValid() || !scheduledCourseEnd.isValid()) {
      const errMsg = `${errorPrefix} Mailfunction : Computed start and End date  must be valid moments objects`;
      throw errorPlusLogger(errMsg);
    }

    const someRes = (
      aSubjectCourseStartDate.isBetween(scheduledCourseStart, scheduledCourseEnd, null, '[]')
      || aSubjectCourseEndDate.isBetween(scheduledCourseStart, scheduledCourseEnd, null, '[]')
      || scheduledCourseStart.isBetween(aSubjectCourseStartDate, aSubjectCourseEndDate, null, '[]')
      || scheduledCourseEnd.isBetween(aSubjectCourseStartDate, aSubjectCourseEndDate, null, '[]')
    );
    return someRes;
  });
  return retValue;
};

/**
 * This function will take Jason record (CourseSchedule) and will add the
 * needed data structure of CourseSchedule-s that is kept in GongsManager.
 * This is usually called when retrieving the persisted data or receiving a
 * request  for a new record.
 * @param aJsonCourseScheduleRecord
 * @param aCurrentTime
 * @returns {CourseSchedule} the new CourseSchedule object that was created
 * and used
 */
const handleJsonCourseScheduleRecord = (aJsonCourseScheduleRecord, aCurrentTime = moment().startOf('day')) => {
  const errorPrefix = 'GongsManager.handleJsonCourseScheduleRecord ERROR.';
  if (!aJsonCourseScheduleRecord || !aJsonCourseScheduleRecord.date || !aJsonCourseScheduleRecord.course_name) {
    const errMsg = `${errorPrefix} Json argument is [partly] empty or invalid`;
    throw errorPlusLogger(errMsg);
  }

  const courseStartDate = moment(aJsonCourseScheduleRecord.date, dateFormat);
  if (!courseStartDate.isValid()) {
    const { date } = aJsonCourseScheduleRecord;
    const errMsg = `${errorPrefix} Json date invalid('YYYY-MM-DD','${date}')`;
    throw errorPlusLogger(errMsg);
  }

  const courseName = aJsonCourseScheduleRecord.course_name;
  const course = utilsManager.coursesMap.get(courseName);
  if (!course) {
    const errMsg = `${errorPrefix} Course not found for name: ${courseName}`;
    throw errorPlusLogger(errMsg);
  }

  const timedGongsArray = [];
  const startDateInMSec = courseStartDate.valueOf();
  const isAfter = courseStartDate.isAfter(aCurrentTime);
  const courseStartDay = aJsonCourseScheduleRecord.startFromDay ? aJsonCourseScheduleRecord.startFromDay : 0;
  const courseEndDate = courseStartDate.clone().add(course.daysCount - courseStartDay - 1, 'd');
  const startDateInterpolatedInMSec = startDateInMSec - courseStartDay * 24 * 3600000;

  const isColliding = checkCourseCollision(courseStartDate, courseEndDate);
  if (isColliding) {
    const { date } = aJsonCourseScheduleRecord;
    const endDate = courseEndDate.format(dateFormat);
    const errMsg = `${errorPrefix} Course (${courseName}:${date}=>${endDate})is colliding with other courses`;
    throw errorPlusLogger(errMsg);
  }

  const currentTimeInMSec = moment().valueOf();
  const courseScheduleObject = CourseSchedule.fromJson(aJsonCourseScheduleRecord, startDateInMSec);
  const exceptions = (courseScheduleObject.exceptions && courseScheduleObject.exceptions.length > 0)
    ? courseScheduleObject.exceptions : null;
  if (isAfter || aCurrentTime.isBetween(courseStartDate, courseEndDate, null, '[]')) {
    // Preparing the timedGongsArray - which will hold the gongs with their
    // computed time
    course.timedGongsArray.forEach(/** @param {ManualGong} timedGongRecord */(timedGongRecord) => {
      // If gong to start form a day other than 0
      const rawMomentOfTimedGongRecord = moment(timedGongRecord.time);
      const timedGongRecordDay = rawMomentOfTimedGongRecord.dayOfYear();
      if (courseStartDay + 1 > timedGongRecordDay) {
        return; // disregarding this record - it isn't to be included
      }

      // If it is a test - need to duplicate the times (which is in minutes in an hour to the
      // hours Range specified for the Schedule Course Record
      let timedGongRecordArray = Array.of(timedGongRecord);
      if (course.isTest) {
        timedGongRecordArray = [];
        const hrsRange = courseScheduleObject.testHoursRange;
        if (!hrsRange) {
          const errMsg = `${errorPrefix} Missing testHoursRange in test CourseSchedule`;
          throw errorPlusLogger(errMsg);
        }
        const startHour = Number(hrsRange.start);
        const endHour = Number(hrsRange.end);
        if (Number.isNaN(startHour) || Number.isNaN(endHour) || startHour > endHour) {
          const rangeClause = `${hrsRange.start}-${hrsRange.end}`;
          const errMsg = `${errorPrefix} start and/or end test hours range are invalid : ${rangeClause}`;
          throw errorPlusLogger(errMsg);
        }
        const milSecInHr = 3600000;
        for (let hour = startHour; hour <= endHour; hour += 1) {
          const timedTestGong = timedGongRecord.cloneWhileAddingTime(hour * milSecInHr);
          timedGongRecordArray.push(timedTestGong);
        }
      } // End if (course.isTest)

      // Now handling the multipledTimedGongRecord in the timedGongRecordArray
      // which can be one record (timedGongRecord) or multiplication of timedGongRecord
      // in case it is a test course
      timedGongRecordArray.forEach(/** @param {ManualGong} multipliedTimedGongRecord */(multipliedTimedGongRecord) => {

        const timedComputedGong = multipliedTimedGongRecord.cloneWhileAddingTime(startDateInterpolatedInMSec);

        // If it is passed time or included with the exceptions
        if (!(isAfter || currentTimeInMSec <= timedComputedGong.time)
          || (exceptions && exceptions.some(
            (exceptionGong) => exceptionGong.getTotalTimeInMsec() === timedGongRecord.time,
          ))
        ) {
          timedComputedGong.isActive = false;
        } else {
          timedGongsArray.push(timedComputedGong);
        }
      });
    });
  } else {
    // preparing for obsolete courses
    gongsManagerInstance.passedCoursesArray.push(aJsonCourseScheduleRecord);
    const errMsg = `${errorPrefix} Course is probably before current time`;
    errorPlusLogger(errMsg);
  }
  // If all went well, adding the needed data structure
  if (timedGongsArray.length > 0) {
    gongsManagerInstance.scheduledCoursesArray.push(courseScheduleObject);
    gongsManagerInstance.automaticGongsMap.set(startDateInMSec, timedGongsArray);
    return courseScheduleObject;
  }

  return null;
};

const readFileSyncAsParsedJson = (aDataContainerDataName) => {
  const jsonFromFile = fs.readFileSync(`${gongsManagerInstance.dynamicJsonFilesPath}/${aDataContainerDataName}.json`);
  const parsedJson = JSON.parse(jsonFromFile);
  return parsedJson;
};

const persistDataObject = (aDataContainerDataName, aJsonObject, aOnResolve, aOnReject) => new Promise(
  (resolve, reject) => {
    fs.writeFile(`${gongsManagerInstance.dynamicJsonFilesPath}/${aDataContainerDataName}.json`,
      JSON.stringify(aJsonObject),
      (err) => {
        if (err) {
          logger.gongsManager.error(`gongsManager.js=>persistDataObject(${aDataContainerDataName})`
            + ' Error: Failed to save updated scheduled courses', { error: err });
          if (aOnReject) {
            aOnReject();
          }
          reject(err);
        }
        if (aOnResolve) {
          aOnResolve();
        }
        resolve(true);
      });
  },
);

const persistScheduledCourses = (aOnResolve, aOnReject) => persistDataObject('coursesSchedule',
  gongsManagerInstance.scheduledCoursesArray, aOnResolve, aOnReject);

const persistManualGongs = (aOnResolve, aOnReject) => {
  let returnPromise = persistDataObject('manualGong', gongsManagerInstance.manualGongArray, null, aOnReject);
  returnPromise.then(() => {
    returnPromise = persistDataObject(
      'obsoleteManualGong', gongsManagerInstance.obsoleteManualGongArray, aOnResolve, aOnReject,
    );
  });
  return returnPromise;
};

const cleanScheduleCourses = () => {
  if (gongsManagerInstance.passedCoursesArray.length > 0) {
    logger.gongsManager.info('Obsolete scheduled course that were archived are : \n',
      { courses: gongsManagerInstance.passedCoursesArray });
    let archivedCoursesScheduleJson;
    fs.readFile(`${gongsManagerInstance.dynamicJsonFilesPath}/archivedCoursesSchedule.json`, (err, data) => {
      if (!err) {
        archivedCoursesScheduleJson = data;
      } else {
        logger.gongsManager.error('No Archive file present', { error: err });
      }

      if (!archivedCoursesScheduleJson) {
        archivedCoursesScheduleJson = '[]';
      }

      persistScheduledCourses()
        .then(() => {
          const archivedCoursesSchedule = JSON.parse(archivedCoursesScheduleJson);
          archivedCoursesSchedule.push(...gongsManagerInstance.passedCoursesArray);

          persistDataObject('archivedCoursesSchedule', archivedCoursesSchedule)
            .then(() => {
              gongsManagerInstance.passedCoursesArray = [];
            });
        });
    });
  }
};

const cleanManualGongs = () => {
  if (gongsManagerInstance.manualGongArray && gongsManagerInstance.manualGongArray.length) {
    const currentMoment = moment();
    const obsoleteGongs = gongsManagerInstance.manualGongArray.filter((gong) => currentMoment.isAfter(gong.time));
    if (obsoleteGongs && obsoleteGongs.length) {
      if (!gongsManagerInstance.obsoleteManualGongArray) {
        gongsManagerInstance.obsoleteManualGongArray = [];
      }
      obsoleteGongs.forEach((gong) => gong.del_code = 'O');
      gongsManagerInstance.obsoleteManualGongArray.push(...obsoleteGongs);
      gongsManagerInstance.manualGongArray = gongsManagerInstance.manualGongArray.filter(
        (gong) => !currentMoment.isAfter(gong.time),
      );
      persistManualGongs();
    }
  }
};

const buildJobOutOfTimedGong = (aTimedGong, aIsManual = false) =>
  createNewJob(aTimedGong.time, aTimedGong.gong, aIsManual);

const buildJobArrayOutOfTimedGongArray = (aTimedGongsArray, aIsManual = false) => {
  const retJobsArray = aTimedGongsArray.map((timedGong) => buildJobOutOfTimedGong(timedGong, aIsManual));
  return retJobsArray;
};

const getGongsAsJobsArrayForInit = () => {
  const retJobsArray = [];
  retJobsArray.push(...buildJobArrayOutOfTimedGongArray(gongsManagerInstance.manualGongArray, true));

  logger.gongsManager.info('Initial manual gongs added to the system:',
    {
      init: true,
      gongs: gongsManagerInstance.manualGongArray
    });

  gongsManagerInstance.automaticGongsMap.forEach((aTimedGongsArray, aScheduledCourseId) => {
    const activeTimedGongsArray = aTimedGongsArray.filter((timedGong) => timedGong.isActive);
    const scheduledCourse =
      gongsManagerInstance.scheduledCoursesArray.find((aScheduledCourse) => aScheduledCourse.id === aScheduledCourseId);

    logger.gongsManager.info('Initial automatic gongs added to the system for course %s:',
      {
        init: true,
        gongs: activeTimedGongsArray,
        scheduledCourse,
      });

    retJobsArray.push(...buildJobArrayOutOfTimedGongArray(activeTimedGongsArray));
  });
  return retJobsArray;
};

class GongsManager {
  constructor() {
    this.dynamicJsonFilesPath = 'assets/data';
    this.onGongActionListenersArray = [];
    this.manualGongArray = [];
    this.obsoleteManualGongArray = [];
    this.automaticGongsMap = new Map();
    this.scheduledCoursesArray = [];
    this.passedCoursesArray = [];
  }

  init() {
    this.retrieveAutomaticGongs();
    this.retrieveManualGongs();

    // Dispatching all the active jobs
    const totalJobsArray = getGongsAsJobsArrayForInit();
    activateGongListenersForJobOrJobs(totalJobsArray, 'ADD_INIT');
  }

  getManualGongsList() {
    return this.manualGongArray;
  }

  setDynamicJsonFilesPath(aNewPath) {
    this.dynamicJsonFilesPath = aNewPath;
  }

  addManualGong(aJsonManualGong) {
    if (!aJsonManualGong || !aJsonManualGong.time || !aJsonManualGong.gong || !aJsonManualGong.gong.areas
      || aJsonManualGong.gong.gongType === undefined || Number.isNaN(Number(aJsonManualGong.gong.gongType))
      || !aJsonManualGong.gong.repeat || Number.isNaN(Number(aJsonManualGong.gong.repeat))
      || !Array.isArray(aJsonManualGong.gong.areas)
      || aJsonManualGong.gong.areas.length <= 0
      || aJsonManualGong.gong.areas.some(area => Number.isNaN(Number(area)))) {
      const strigifiedGong = JSON.stringify(aJsonManualGong);
      const errMsg =
        `GongsManager.addManualGong ERROR.Json argument is [partly] empty or invalid. ****Gong = ${strigifiedGong}`;
      return errorOnPromisePlusLogger(errMsg);
    }

    const newManualGong = jsonClassConverter.convertOneObject(aJsonManualGong, 'ManualGong');

    if (!newManualGong.time) {
      const errMsg = 'GongsManager.addManualGong ERROR.Invalid time';
      return errorOnPromisePlusLogger(errMsg);
    }
    if (moment().isAfter(newManualGong.time)) {
      const errMsg = 'GongsManager.addManualGong ERROR. Cannot add a gong scheduled before now';
      return errorOnPromisePlusLogger(errMsg);
    }

    this.manualGongArray.push(newManualGong);
    this.manualGongArray.sort(timedGongsCompareFunc);

    const persistPromise = persistDataObject('manualGong', this.manualGongArray);
    persistPromise.then(() => {
      activateGongListeners(newManualGong.time, newManualGong.gong, undefined, true);
    });

    return persistPromise;
  }

  removeManualGong(aJsonScheduledGong) {
    if (!aJsonScheduledGong || !aJsonScheduledGong.time
      || Number.isNaN(Number(aJsonScheduledGong.time))) {
      const errMsg = 'GongsManager.removeManualGong ERROR.Json argument is [partly] empty or invalid';
      return errorOnPromisePlusLogger(errMsg);
    }
    const gongTime = aJsonScheduledGong.time;
    const foundIndex = this.manualGongArray.findIndex((manualGong) => manualGong.time === gongTime);
    if (foundIndex >= 0) {
      this.obsoleteManualGongArray.push(this.manualGongArray[foundIndex]);
      this.manualGongArray.splice(foundIndex, 1);
    } else {
      const errMsg = `GongsManager.removeManualGong ERROR. Gong not found for time = ${gongTime}`;
      return errorOnPromisePlusLogger(errMsg);
    }

    const persistPromise = persistManualGongs();
    persistPromise.then(() => {
      activateGongListeners(gongTime, null, 'DELETE');
    });

    return persistPromise;
  }


  toggleGong(aJsonScheduledCourseGong) {
    const courseId = aJsonScheduledCourseGong.course_id;

    /** @var {CourseSchedule} foundCourseSchedule */
    const foundCourseSchedule = gongsManagerInstance.scheduledCoursesArray.find(
      (courseSchedule) => courseSchedule.id === courseId,
    );
    if (!foundCourseSchedule) {
      return Promise.reject(new Error(`CourseSchedule Not found for courseId = ${courseId}`));
    }
    const exception = ExceptionGong.fromJson(aJsonScheduledCourseGong);
    // If exception does't exist - will need to add it and exclude the gong form

    // Finding the gong on the data structure and toggle it
    const momentOfCourseStart = moment(foundCourseSchedule.date);

    const timeOfCourseStart = momentOfCourseStart.valueOf();
    const timedGongsArray = gongsManagerInstance.automaticGongsMap.get(timeOfCourseStart);

    const gongTime = timeOfCourseStart + exception.getTotalTimeInMsec()
      - foundCourseSchedule.startFromDay * 24 * 3600000;

    const foundGong = timedGongsArray.find((/* ManualGong */gong) => gong.time === gongTime);
    if (!foundGong) {
      return Promise.reject(new Error(`Gong Not found for courseId = ${courseId} and time = ${gongTime}`));
    }

    const exceptionExists = foundCourseSchedule.isExceptionExists(exception);
    if (exceptionExists === foundGong.isActive) {
      const exceptionStringified = JSON.stringify(exception);
      const foundCourseScheduleStringified = JSON.stringify(foundCourseSchedule);
      logger.gongsManager.error('GongsManager.toggleGong Error : Exception exists'
        + ` = ${exceptionExists} and isActive = ${foundGong.isActive}.`
        + `\n\t exception = ${exceptionStringified}`
        + `\n\t foundCourseSchedule = ${foundCourseScheduleStringified}`);
    }
    foundGong.toggleActive();
    let persistPromise;
    // Extracting the gong out of the scheduler
    if (!exceptionExists) {
      foundCourseSchedule.insertException(exception);
      persistPromise = persistScheduledCourses(() => {
        const deleteJob = createNewJob(gongTime, {}, false);
        activateGongListenersForJobOrJobs(deleteJob, 'DELETE');
      });
    } else {
      // Else - will need to delete it and reinsert the original gong that was
      // scheduled for this course
      // eslint-disable-next-line no-lonely-if
      if (foundCourseSchedule.removeException(exception)) {
        persistPromise = persistScheduledCourses(() => {
          // Re-inserting the gong out of the scheduler
          const addedJob = createNewJob(gongTime, foundGong, false);
          activateGongListenersForJobOrJobs(addedJob, 'ADD');
        });
      } else {
        throw new Error('GongsManager.toggleGong Error : couldn\'t remove Exception');
      }
    }

    return persistPromise;
  }

  retrieveAutomaticGongs() {
    const coursesScheduleJson = fs.readFileSync(`${this.dynamicJsonFilesPath}/coursesSchedule.json`);
    const coursesSchedule = JSON.parse(coursesScheduleJson);

    coursesSchedule.forEach((jsonCourseScheduleRecord) => {
      handleJsonCourseScheduleRecord(jsonCourseScheduleRecord);
    });
    this.scheduledCoursesArray.sort(((a, b) => a.date - b.date));

    cleanScheduleCourses();
  }

  addScheduledCourse(aJsonCourseScheduleRecord) {
    if (!aJsonCourseScheduleRecord || !aJsonCourseScheduleRecord.date || !aJsonCourseScheduleRecord.course_name) {
      const errMsg = 'GongsManager.addScheduledCourse ERROR.Json argument is [partly] empty or invalid';
      return errorOnPromisePlusLogger(errMsg);
    }

    const persistPromise = new Promise((resolve, reject) => {
      const courseScheduleObject = handleJsonCourseScheduleRecord(aJsonCourseScheduleRecord);
      if (courseScheduleObject) {
        this.scheduledCoursesArray.sort(((a, b) => a.date - b.date));
        persistScheduledCourses()
          .then(() => {
            const jobsArray = buildJobArrayOutOfTimedGongArray(this.automaticGongsMap.get(courseScheduleObject.id));
            activateGongListenersForJobOrJobs(jobsArray);
            resolve(courseScheduleObject);
          })
          .catch((error) => {
            loggerOutOfError('GongsManager.addScheduledCourse Error.', error);
            reject(error);
          });
      } else {
        const error = errorPlusLogger('GongsManager.addScheduledCourse Error: Failed to construct CourseSchedule');
        reject(error);
      }
    });
    return persistPromise;
  }

  removeScheduledCourse(aJsonCourseScheduleForRemoveRecord) {
    const errorPrefix = 'GongsManager.removeScheduledCourse ERROR.';
    if (!aJsonCourseScheduleForRemoveRecord || !aJsonCourseScheduleForRemoveRecord.id
      || Number.isNaN(Number(aJsonCourseScheduleForRemoveRecord.id))) {
      const errMsg = `${errorPrefix} Json argument is [partly] empty or invalid`;
      return errorOnPromisePlusLogger(errMsg);
    }

    const persistPromise = new Promise((resolve, reject) => {
      const courseScheduleForRemoveId = aJsonCourseScheduleForRemoveRecord.id;
      const foundIndex = this.scheduledCoursesArray.findIndex(
        (courseSchedule) => courseSchedule.id === courseScheduleForRemoveId,
      );
      if (foundIndex >= 0) {
        this.scheduledCoursesArray.splice(foundIndex, 1);
        persistScheduledCourses()
          .then(() => {
            // delete the scheduled jobs
            const timedGongsArray = this.automaticGongsMap.get(courseScheduleForRemoveId);
            const timedGongsJobsArray = buildJobArrayOutOfTimedGongArray(timedGongsArray);
            activateGongListenersForJobOrJobs(timedGongsJobsArray, 'DELETE');
            const successDeletingFromMap = this.automaticGongsMap.delete(courseScheduleForRemoveId);
            if (!successDeletingFromMap) {
              const errMsg = `${errorPrefix} Could not remove course from automaticGongsMap`;
              errorPlusLogger(errMsg);
              resolve('Error');
            }
            resolve('SUCCESS');
          })
          .catch((error) => {
            const errMsg = `${errorPrefix} Error for persisting the new courses list`;
            loggerOutOfError(errMsg, error);
            reject(error);
          });
      } else {
        const errMsg = `${errorPrefix} Failed to find CourseSchedule with id =${courseScheduleForRemoveId}`;
        const noIdError = errorPlusLogger(errMsg);
        reject(noIdError);
      }
    });
    return persistPromise;
  }

  retrieveManualGongs() {
    this.manualGongArray = readFileSyncAsParsedJson('manualGong');
    this.obsoleteManualGongArray = readFileSyncAsParsedJson('obsoleteManualGong');
    cleanManualGongs();
  }

  addOnGongActionListener(listenerFunction) {
    this.onGongActionListenersArray.push(listenerFunction);
  }
}

gongsManagerInstance = new GongsManager();
module.exports = gongsManagerInstance;
