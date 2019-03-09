const fs = require('fs');
const moment = require('moment');
const Gong = require('../model/gong');
const ManualGong = require('../model/manualGong');
const Job = require('../model/job');
const CourseSchedule = require('../model/courseSchedule');
const ExceptionGong = require('../model/exceptionGong');


let gongsManagerInstance;

const timedGongsCompareFunc = (a, b) => a.time - b.time;
const dateFormat = 'YYYY-MM-DD';

class Course {
  constructor(aTimedGongsArray, aDaysCount) {
    this.timedGongsArray = aTimedGongsArray;
    this.daysCount = aDaysCount;
  }
}

const addNewGongToArray = (aCourseDay, aGongTimeStr, aNewGong, aGongsArray) => {
  const gongTimeFromCourseStart = moment.duration(`${aCourseDay}.${aGongTimeStr}`);
  const timedGong = new ManualGong(gongTimeFromCourseStart.asMilliseconds(), aNewGong);
  aGongsArray.push(timedGong);
};

const activateGongListenersForJob = (aJobOrJobs, aAction = 'ADD') => {
  gongsManagerInstance.onGongActionListenersArray.forEach((listener) => listener(aJobOrJobs, aAction));
};

const activateGongListeners = (aTime, aData, aAction) => {
  const newJob = new Job(aTime, aData);
  activateGongListenersForJob(newJob, aAction);
};

const activateGongListenersForArrays = (aJobsArray, aAction) => {
  aJobsArray.forEach((job) => activateGongListenersForJob(job, aAction));
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
const handleJsonCourseScheduleRecord = (aJsonCourseScheduleRecord, aCurrentTime = moment()) => {
  const timedGongsArray = [];
  const courseName = aJsonCourseScheduleRecord.course_name;
  const course = gongsManagerInstance.coursesMap.get(courseName);
  const courseStartDate = moment(aJsonCourseScheduleRecord.date, dateFormat);
  const startDateInMSec = courseStartDate.valueOf();
  const isAfter = courseStartDate.isAfter(aCurrentTime);
  const courseEndDate = !isAfter && courseStartDate.clone().add(course.daysCount, 'd');
  const currentTimeInMSec = aCurrentTime.valueOf();
  const courseScheduleObject = CourseSchedule.fromJson(aJsonCourseScheduleRecord, startDateInMSec);
  const exceptions = (courseScheduleObject.exceptions && courseScheduleObject.exceptions.length > 0)
    ? courseScheduleObject.exceptions : null;
  if (isAfter || aCurrentTime.isBetween(courseStartDate, courseEndDate, null, '[]')) {
    // Preparing the timedGongsArray - which will hold the gongs with their
    // computed time
    course.timedGongsArray.forEach((timedGongRecord) => {
      const timedComputedGong = timedGongRecord.cloneWhileAddingTime(startDateInMSec);
      // If it is passed time or included with the exceptions
      if (!(isAfter || currentTimeInMSec <= timedComputedGong.time)
        || (exceptions && exceptions.some(
          (exceptionGong) => exceptionGong.getTotalTimeInMsec() === timedGongRecord.time,
        ))
      ) {
        timedComputedGong.isActive = false;
      }
      timedGongsArray.push(timedComputedGong);
    });
  } else {
    // preparing for obsolete courses
    gongsManagerInstance.passedCoursesArray.push(aJsonCourseScheduleRecord);
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
  const jsonFromFile = fs.readFileSync(`assets/data/${aDataContainerDataName}.json`);
  const parsedJson = JSON.parse(jsonFromFile);
  return parsedJson;
};

const persistDataObject = (aDataContainerDataName, aJsonObject, aOnResolve, aOnReject) => new Promise((resolve, reject) => {
  fs.writeFile(`assets/data/${aDataContainerDataName}.json`, JSON.stringify(aJsonObject), (err) => {
    if (err) {
      console.log(`gongsManager.js=>persistDataObject(${aDataContainerDataName}) `
          + 'Error: Failed to save updated scheduled courses', err);
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
});

const persistScheduledCourses = (aOnResolve, aOnReject) => persistDataObject('coursesSchedule', gongsManagerInstance.scheduledCoursesArray, aOnResolve, aOnReject);

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
    console.log('Obsolete scheduled course that were archived are : \n', gongsManagerInstance.passedCoursesArray);
    let archivedCoursesScheduleJson;
    fs.readFile('assets/data/archivedCoursesSchedule.json', (err, data) => {
      if (!err) {
        archivedCoursesScheduleJson = data;
      } else {
        console.log('No Archive file present', err);
      }

      if (!archivedCoursesScheduleJson) {
        archivedCoursesScheduleJson = '[]';
      }

      persistScheduledCourses().then(() => {
        const archivedCoursesSchedule = JSON.parse(archivedCoursesScheduleJson);
        archivedCoursesSchedule.push(...gongsManagerInstance.passedCoursesArray);

        persistDataObject('archivedCoursesSchedule', archivedCoursesSchedule).then(() => {
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

const buildJobOutOfTimedGong = (aTimedGong, aIsManual = false) => new Job(aTimedGong.time, aTimedGong.gong, aIsManual);

const buildJobArrayOutOfTimedGongArray = (aTimedGongsArray, aIsManual = false) => {
  const retJobsArray = aTimedGongsArray.map((timedGong) => buildJobOutOfTimedGong(timedGong, aIsManual));
  return retJobsArray;
};

const getGongsAsJobsArray = () => {
  const retJobsArray = [];
  retJobsArray.push(...buildJobArrayOutOfTimedGongArray(gongsManagerInstance.manualGongArray, true));
  gongsManagerInstance.automaticGongsMap.forEach((timedGongsArray) => {
    const activeTimedGongsArray = timedGongsArray.filter((timedGong) => timedGong.isActive);
    retJobsArray.push(...buildJobArrayOutOfTimedGongArray(activeTimedGongsArray));
  });
  return retJobsArray;
};

class GongsManager {
  constructor() {
    this.onGongActionListenersArray = [];
    this.coursesMap = new Map();
    this.manualGongArray = [];
    this.obsoleteManualGongArray = [];
    this.automaticGongsMap = new Map();
    this.scheduledCoursesArray = [];
    this.passedCoursesArray = [];
  }

  init() {
    this.buildCoursesMap();
    this.retrieveAutomaticGongs();
    this.retrieveManualGongs();

    // Dispatching all the active jobs
    const totalJobsArray = getGongsAsJobsArray();
    activateGongListenersForJob(totalJobsArray);
  }

  getManualGongsList() {
    return this.manualGongArray;
  }

  buildCoursesMap() {
    const coursesJson = fs.readFileSync('assets/data/courses.json');
    const cousesArray = JSON.parse(coursesJson);
    cousesArray.forEach((course) => {
      const timedGongsArray = [];
      const courseAgenda = course.course_agenda;
      courseAgenda.forEach((courseAgendaRecord) => {
        const courseGongsDays = courseAgendaRecord.days;
        const courseGongs = courseAgendaRecord.gongs;
        courseGongsDays.forEach((courseDay) => {
          const newGong = new Gong(courseGongs.type, courseGongs.areas, courseGongs.volume);
          courseGongs.times.forEach((gongTimeStr) => {
            if (gongTimeStr.indexOf(':') > 0) {
              addNewGongToArray(courseDay, gongTimeStr, newGong, timedGongsArray);
            } else {
              // let hourInDay;
              for (let hourInDay = 7; hourInDay < 8; hourInDay += 1) { // 0 .. < 24
                addNewGongToArray(courseDay, hourInDay + gongTimeStr, newGong, timedGongsArray);
              }
            }
          }); // Of courseGongs.times.forEach => gongTimeStr
        }); // Of courseGongsDays.forEach => courseDay
      });
      timedGongsArray.sort(timedGongsCompareFunc);
      this.coursesMap.set(course.course_name, new Course(timedGongsArray, course.days_count));
    }); // Of cousesArray.forEach
  }

  addManualGong(aJsonManualGong) {
    const newManualGong = new ManualGong();

    const momentTime = moment(aJsonManualGong.time);
    if (moment().isAfter(momentTime)) {
      return Promise.reject(new Error('GongsManager.addManualGong ERROR. Cannot add a gong scheduled before now'));
    }
    momentTime.seconds(0);

    newManualGong.time = momentTime.valueOf();
    newManualGong.isActive = aJsonManualGong.isActive;
    newManualGong.gong.areas = aJsonManualGong.gong.areas;
    newManualGong.gong.gongType = aJsonManualGong.gong.gongType;
    newManualGong.gong.volume = aJsonManualGong.gong.volume;

    this.manualGongArray.push(newManualGong);
    this.manualGongArray.sort(timedGongsCompareFunc);

    const persistPromise = persistDataObject('manualGong', this.manualGongArray);
    persistPromise.then(() => {
      activateGongListeners(newManualGong.time, newManualGong.gong);
    });

    return persistPromise;
  }

  removeManualGong(aJsonScheduledGong) {
    const gongTime = aJsonScheduledGong.time;
    const foundIndex = this.manualGongArray.findIndex((manualGong) => manualGong.time === gongTime);
    if (foundIndex) {
      this.obsoleteManualGongArray.push(this.manualGongArray[foundIndex]);
      this.manualGongArray.splice(foundIndex, 1);
    } else {
      return Promise.reject(new Error(`GongsManager.removeManualGong ERROR. Gong not found for time = ${gongTime}`));
    }

    const persistPromise = persistManualGongs();
    persistPromise.then(() => {
      activateGongListeners(gongTime, null, 'DELETE');
    });

    return persistPromise;
  }


  toggleGong(aJsonScheduledCourseGong) {
    const courseId = aJsonScheduledCourseGong.course_id;

    const foundCourseSchedule = gongsManagerInstance.scheduledCoursesArray.find(
      (courseSchedule) => courseSchedule.id === courseId,
    );
    if (!foundCourseSchedule) {
      return Promise.reject(new Error(`CourseSchedule Not found for courseId = ${courseId}`));
    }
    const exception = ExceptionGong.fromJson(aJsonScheduledCourseGong);
    // If exception does't exist - will need to add it and exclude the gong form

    // Finding the gong on the data strucure and toggle it
    const momentOfCourseStart = moment(foundCourseSchedule.date);

    const timeOfCourseStart = momentOfCourseStart.valueOf();
    const timedGongsArray = gongsManagerInstance.automaticGongsMap.get(timeOfCourseStart);

    const gongTime = timeOfCourseStart + exception.getTotalTimeInMsec();

    const foundGong = timedGongsArray.find((/* ManualGong */gong) => gong.time === gongTime);
    if (!foundGong) {
      return Promise.reject(new Error(`Gong Not found for courseId = ${courseId} and time = ${gongTime}`));
    }

    const exceptionExists = foundCourseSchedule.isExceptionExists(exception);
    if (exceptionExists === foundGong.isActive) {
      console.error('GongsManager.toggleGong Error : Exception exists'
        + ` = ${exceptionExists} and isActive = ${foundGong.isActive}. exception = `, exception, foundCourseSchedule);
    }
    foundGong.toggleActive();
    let persistPromise;
    // Extracting the gong out of the scheduler
    if (!exceptionExists) {
      foundCourseSchedule.insertException(exception);
      persistPromise = persistScheduledCourses(() => {
        const deleteJob = new Job(gongTime, {}, false);
        activateGongListenersForJob(deleteJob, 'DELETE');
      });
    } else {
      // Else - will need to delete it and reinsert the original gong that was
      // scheduled for this course
      // eslint-disable-next-line no-lonely-if
      if (foundCourseSchedule.removeException(exception)) {
        persistPromise = persistScheduledCourses(() => {
          // Re-inserting the gong out of the scheduler
          const addedJob = new Job(gongTime, foundGong, false);
          activateGongListenersForJob(addedJob, 'ADD');
        });
      } else {
        throw new Error('GongsManager.toggleGong Error : couldn\'t remove Exception');
      }
    }

    return persistPromise;
  }

  retrieveAutomaticGongs() {
    const coursesScheduleJson = fs.readFileSync('assets/data/coursesSchedule.json');
    const coursesSchedule = JSON.parse(coursesScheduleJson);

    const currentTime = moment();

    coursesSchedule.forEach((jsonCourseScheduleRecord) => {
      handleJsonCourseScheduleRecord(jsonCourseScheduleRecord, currentTime);
    });
    this.scheduledCoursesArray.sort(((a, b) => a.date - b.date));

    cleanScheduleCourses();
  }

  addScheduledCourse(aJsonCourseScheduleRecord) {
    const persistPromise = new Promise((resolve, reject) => {
      const courseScheduleObject = handleJsonCourseScheduleRecord(aJsonCourseScheduleRecord);
      if (courseScheduleObject) {
        this.scheduledCoursesArray.sort(((a, b) => a.date - b.date));
        persistScheduledCourses()
          .then(() => {
            const jobsArray = buildJobArrayOutOfTimedGongArray(this.automaticGongsMap.get(courseScheduleObject.id));
            activateGongListenersForArrays(jobsArray);
            resolve(courseScheduleObject);
          })
          .catch((error) => {
            console.error('GongsManager.addScheduledCourse Error', error);
            reject(error);
          });
      } else {
        reject(
          new Error('GongsManager.addScheduledCourse Error: Failed to construct CourseSchedule'),
        );
      }
    });
    return persistPromise;
  }

  removeScheduledCourse(aJsonCourseScheduleForRemoveRecord) {
    const persistPromise = new Promise((resolve, reject) => {
      const courseScheduleForRemoveId = aJsonCourseScheduleForRemoveRecord.id;
      const foundIndex = this.scheduledCoursesArray.findIndex(
        (courseSchedule) => courseSchedule.id === courseScheduleForRemoveId,
      );
      if (foundIndex) {
        this.scheduledCoursesArray.splice(foundIndex, 1);
        persistScheduledCourses()
          .then(() => {
            // delete the scheduled jobs
            const timedGongsArray = this.automaticGongsMap.get(courseScheduleForRemoveId);
            const timedGongsJobsArray = buildJobArrayOutOfTimedGongArray(timedGongsArray);
            activateGongListenersForJob(timedGongsJobsArray, 'DELETE');
            this.automaticGongsMap.delete(courseScheduleForRemoveId);
            resolve('SUCCESS');
          })
          .catch((error) => reject(error));
      } else {
        reject(new Error('GongsManager.removeScheduledCourse Error: '
          + `Failed to find CourseSchedule with id =${courseScheduleForRemoveId}`));
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
