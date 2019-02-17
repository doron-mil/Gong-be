const fs = require('fs');
const moment = require('moment');
const Gong = require('../model/gong');
const ManualGong = require('../model/manualGong');
const Job = require('../model/job');

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

class GongsManager {
  constructor() {
    this.onAddGongListenersArray = [];
    this.coursesMap = new Map();
    this.manualGongArray = [];
    this.automaticGongsMap = new Map();
    this.scheduledCoursesArray = [];
    this.passedCoursesArray = [];

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

    const persistPromise = this.persistManualGongArray();
    if (this.onAddGongListenersArray.length > 0) {
      persistPromise.then(() => {
        const newJob = new Job(newManualGong.time, newManualGong.gong);
        this.onAddGongListenersArray.forEach(listener => listener(newJob));
      });
    }

    return persistPromise;
  }

  retrieveAutomaticGongs() {
    const coursesScheduleJson = fs.readFileSync('assets/data/coursesSchedule.json');
    const coursesSchedule = JSON.parse(coursesScheduleJson);

    const currentTime = moment();
    const currentTimeInMSec = currentTime.valueOf();

    coursesSchedule.forEach((courseScheduleRecord) => {
      const timedGongsArray = [];
      const courseName = courseScheduleRecord.course_name;
      const course = this.coursesMap.get(courseName);
      const courseStartDate = moment(courseScheduleRecord.date, dateFormat);
      const isAfter = courseStartDate.isAfter(currentTime);
      const courseEndDate = !isAfter && courseStartDate.clone()
        .add(course.daysCount, 'd');
      if (isAfter || currentTime.isBetween(courseStartDate, courseEndDate, null, '[]')) {
        this.scheduledCoursesArray.push(courseScheduleRecord);
        const startDateInMSec = courseStartDate.valueOf();
        course.timedGongsArray.forEach((timedGongRecord) => {
          const timedComputedGong = timedGongRecord.cloneWhileAddingTime(startDateInMSec);
          if (isAfter || currentTimeInMSec <= timedComputedGong.time) {
            timedGongsArray.push(timedComputedGong);
          }
        });
      } else {
        this.passedCoursesArray.push(courseScheduleRecord);
      }
      if (timedGongsArray.length > 0) {
        this.automaticGongsMap.set(courseScheduleRecord.date, timedGongsArray);
      }
    });

    if (this.passedCoursesArray.length > 0) {
      this.cleanScheduleCourses();
    }
  }

  retrieveManualGongs() {
    const manualGongJson = fs.readFileSync('assets/data/manualGong.json');
    this.manualGongArray = JSON.parse(manualGongJson);
  }

  addOnAddGongListener(listenerFunction) {
    this.onAddGongListenersArray.push(listenerFunction);
  }

  persistManualGongArray() {
    const jsonData = JSON.stringify(this.manualGongArray);
    return new Promise(function (resolve, reject) {
      fs.writeFile('assets/data/manualGong.json', jsonData, (err) => {
        if (err) {
          reject(err);
        }
        resolve(true);
      });
    });
  }

  getGongsAsJobsArray() {
    const retJobsArray = [];
    this.manualGongArray.forEach((timedGong) => retJobsArray.push(new Job(timedGong.time, timedGong.gong)));
    this.automaticGongsMap.forEach((timedGongsArray) => {
      timedGongsArray.forEach((timedGong) => retJobsArray.push(new Job(timedGong.time, timedGong.gong)));
    });
    return retJobsArray;
  }

  cleanScheduleCourses() {
    console.log('Obsolete scheduled course that were archived are : \n', this.passedCoursesArray);

    if (this.passedCoursesArray.length > 0) {
      // const archivedCoursesScheduleJson = fs.readFileSync('assets/data/archivedCoursesSchedule.json');
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

        fs.writeFile('assets/data/coursesSchedule.json', JSON.stringify(this.scheduledCoursesArray), (err) => {
          if (err) {
            console.log('Failed to save updated scheduled courses', err);
          } else {
            const archivedCoursesSchedule = JSON.parse(archivedCoursesScheduleJson);
            archivedCoursesSchedule.push(...this.passedCoursesArray);

            fs.writeFile('assets/data/archivedCoursesSchedule.json', JSON.stringify(archivedCoursesSchedule), (err) => {
              if (err) {
                console.log('Failed to save archived courses', err);
              } else {
                this.passedCoursesArray = [];
              }
            });
          }
        });
      });
    }
  }
};

module.exports = new GongsManager();
