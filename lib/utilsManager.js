const fs = require('fs');
const moment = require('moment');
const Course = require('../model/course');
const Gong = require('../model/gong');
const GongType = require('../model/gongType');
const ManualGong = require('../model/manualGong');

const timedGongsCompareFunc = (a, b) => a.time - b.time;

const addNewGongToArray = (aCourseDay, aGongTimeStr, aNewGong, aGongsArray, aIsTest = false) => {
  let computedGongTimeStr = aGongTimeStr;
  if (aIsTest) { // The time str will be in the format of ':XX' - meaning the minute in the hour
    computedGongTimeStr = `0${aGongTimeStr}`;
  }
  const gongTimeFromCourseStart = moment.duration(`${aCourseDay}.${computedGongTimeStr}`);
  const timedGong = new ManualGong(gongTimeFromCourseStart.asMilliseconds(), aNewGong);
  aGongsArray.push(timedGong);
};

const buildGongsMap = (/* Map */aGongsMap) => {
  const gongsJson = fs.readFileSync('assets/data/gongsTypes.json');
  const jsonGongTypesArray = JSON.parse(gongsJson);
  jsonGongTypesArray.forEach((jsonGongType) => {
    const gongType = GongType.fromJson(jsonGongType);
    aGongsMap.set(gongType.id, gongType);
  });
};

const buildCoursesMap = (/* Map */aCoursesMap) => {
  const coursesJson = fs.readFileSync('assets/data/courses.json');
  const cousesArray = JSON.parse(coursesJson);
  cousesArray.forEach((course) => {
    const timedGongsArray = [];
    const courseAgenda = course.course_agenda;
    const isTest = course.test;
    courseAgenda.forEach((courseAgendaRecord) => {
      const courseGongsDays = courseAgendaRecord.days;
      const courseGongs = courseAgendaRecord.gongs;
      courseGongsDays.forEach((courseDay) => {
        const newGong = new Gong(courseGongs.type, courseGongs.areas, courseGongs.volume);
        courseGongs.times.forEach((gongTimeStr) => {
          addNewGongToArray(courseDay, gongTimeStr, newGong, timedGongsArray, isTest);
        }); // Of courseGongs.times.forEach => gongTimeStr
      }); // Of courseGongsDays.forEach => courseDay
    });
    timedGongsArray.sort(timedGongsCompareFunc);
    aCoursesMap.set(course.course_name, new Course(timedGongsArray, course.days_count, isTest));
  }); // Of cousesArray.forEach
};

class UtilsManager {
  constructor() {
    this.gongsMap = new Map();
    this.coursesMap = new Map();

    this.init();
  }

  init() {
    buildGongsMap(this.gongsMap);
    buildCoursesMap(this.coursesMap);
  }
}

module.exports = new UtilsManager();
