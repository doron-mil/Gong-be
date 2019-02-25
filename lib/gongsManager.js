const fs = require('fs');
const moment = require('moment');
const Gong = require('../model/gong');
const ManualGong = require('../model/manualGong');
const Job = require('../model/job');
const CourseSchedule = require('../model/courseSchedule');


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

const activateGongListenersForJob = (aJob, aAction = 'ADD') => {
  gongsManagerInstance.onGongActionListenersArray.forEach((listener) => listener(aJob, aAction));
};

const activateGongListeners = (aTime, aData) => {
  const newJob = new Job(aTime, aData);
  activateGongListenersForJob(newJob);
};

const activateGongListenersForArrays = (aJobsArray) => {
  aJobsArray.forEach((job) => activateGongListenersForJob(job));
};

const handleJsonCourseScheduleRecord = (aJsonCourseScheduleRecord, aCurrentTime = moment()) => {
  const timedGongsArray = [];
  const courseName = aJsonCourseScheduleRecord.course_name;
  const course = gongsManagerInstance.coursesMap.get(courseName);
  const courseStartDate = moment(aJsonCourseScheduleRecord.date, dateFormat);
  const startDateInMSec = courseStartDate.valueOf();
  const isAfter = courseStartDate.isAfter(aCurrentTime);
  const courseEndDate = !isAfter && courseStartDate.clone().add(course.daysCount, 'd');
  if (isAfter || aCurrentTime.isBetween(courseStartDate, courseEndDate, null, '[]')) {
    course.timedGongsArray.forEach((timedGongRecord) => {
      const timedComputedGong = timedGongRecord.cloneWhileAddingTime(startDateInMSec);
      if (isAfter || aCurrentTime.valueOf() <= timedComputedGong.time) {
        timedGongsArray.push(timedComputedGong);
      }
    });
  } else {
    gongsManagerInstance.passedCoursesArray.push(aJsonCourseScheduleRecord);
  }
  if (timedGongsArray.length > 0) {
    const courseScheduleObject = CourseSchedule.fromJson(aJsonCourseScheduleRecord, startDateInMSec);
    gongsManagerInstance.scheduledCoursesArray.push(courseScheduleObject);
    gongsManagerInstance.automaticGongsMap.set(startDateInMSec, timedGongsArray);
    return courseScheduleObject;
  }

  return null;
};

const persistDataObject = (aDataContainerDataName, aJsonObject) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(`assets/data/${aDataContainerDataName}.json`, JSON.stringify(aJsonObject), (err) => {
      if (err) {
        console.log(`gongsManager.js=>persistDataObject(${aDataContainerDataName}) `
          + 'Error: Failed to save updated scheduled courses', err);
        reject(err);
      }
      resolve(true);
    });
  });
};

const persistScheduledCourses = () => {
  return persistDataObject('coursesSchedule', gongsManagerInstance.scheduledCoursesArray);
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

const buildJobArrayOutOfTimedGongArray = (aTimedGongsArray, aIsManual = false) => {
  const retJobsArray = aTimedGongsArray.map((timedGong) => new Job(timedGong.time, timedGong.gong, aIsManual));
  return retJobsArray;
};


class GongsManager {
  constructor() {
    this.onGongActionListenersArray = [];
    this.coursesMap = new Map();
    this.manualGongArray = [];
    this.automaticGongsMap = new Map();
    this.scheduledCoursesArray = [];
    this.passedCoursesArray = [];
  }

  init() {
    this.buildCoursesMap();
    this.retrieveAutomaticGongs();
    this.retrieveManualGongs();
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
            }
            else {
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

  addManualGong(jsonManualGong) {
    const newManualGong = new ManualGong();

    const momentTime = moment(jsonManualGong.time);
    momentTime.seconds(0);

    newManualGong.time = momentTime.valueOf();
    newManualGong.isActive = jsonManualGong.isActive;
    newManualGong.gong.areas = jsonManualGong.gong.areas;
    newManualGong.gong.gongType = jsonManualGong.gong.gongType;
    newManualGong.gong.volume = jsonManualGong.gong.volume;

    this.manualGongArray.push(newManualGong);
    this.manualGongArray.sort(timedGongsCompareFunc);

    const persistPromise = persistDataObject('manualGong', this.manualGongArray);
    persistPromise.then(() => {
      activateGongListeners(newManualGong.time, newManualGong.gong);
    });

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
          new Error('GongsManager.addScheduledCourse Error: Failed to construct CourseSchedule')
        );
      }

    });
    return persistPromise;
  }

  removeScheduledCourse(aJsonCourseScheduleForRemoveRecord) {
    const persistPromise = new Promise((resolve, reject) => {
      const courseScheduleForRemoveId = aJsonCourseScheduleForRemoveRecord.id;
      const foundIndex = this.scheduledCoursesArray.findIndex(
        (courseSchedule) => courseSchedule.id === courseScheduleForRemoveId);
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
    const manualGongJson = fs.readFileSync('assets/data/manualGong.json');
    this.manualGongArray = JSON.parse(manualGongJson);
  }

  addOnGongActionListener(listenerFunction) {
    this.onGongActionListenersArray.push(listenerFunction);
  }

  getGongsAsJobsArray() {
    const retJobsArray = [];
    retJobsArray.push(...buildJobArrayOutOfTimedGongArray(this.manualGongArray, true));
    this.automaticGongsMap.forEach((timedGongsArray) => {
      retJobsArray.push(...buildJobArrayOutOfTimedGongArray(timedGongsArray));
    });
    return retJobsArray;
  }
}

gongsManagerInstance = new GongsManager();
module.exports = gongsManagerInstance;
