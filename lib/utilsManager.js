const fs = require('fs');
const moment = require('moment');
const _ = require('lodash');

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

const buildGongsMap = (aUtilsManager) => {
  const { gongsMap, currentStaticData } = aUtilsManager;
  const { gongTypes } = currentStaticData;
  gongTypes.forEach((jsonGongType) => {
    const gongType = GongType.fromJson(jsonGongType);
    gongsMap.set(gongType.id, gongType);
  });
};

function buildCoursesMap(aUtilsManager) {
  const { coursesMap, currentStaticData } = aUtilsManager;
  const { courses } = currentStaticData;
  courses.forEach((course) => {
    const timedGongsArray = [];
    const courseAgenda = course.course_agenda;
    const isTest = course.test;
    courseAgenda.forEach((courseAgendaRecord) => {
      const courseGongsDays = courseAgendaRecord.days;
      const courseGongs = courseAgendaRecord.gongs;
      courseGongsDays.forEach((courseDay) => {
        const newGong = new Gong(courseGongs.type, courseGongs.areas, courseGongs.volume, courseGongs.repeat);
        courseGongs.times.forEach((gongTimeStr) => {
          addNewGongToArray(courseDay, gongTimeStr, newGong, timedGongsArray, isTest);
        }); // Of courseGongs.times.forEach => gongTimeStr
      }); // Of courseGongsDays.forEach => courseDay
    });
    timedGongsArray.sort(timedGongsCompareFunc);
    coursesMap.set(course.course_name, new Course(timedGongsArray, course.days_count, isTest));
  }); // Of coursesArray.forEach
};

function getStaticData(aUtilsManager) {
  const currentStaticRawData = fs.readFileSync('assets/data/staticData.json');
  _.set(aUtilsManager, 'currentStaticData', JSON.parse(currentStaticRawData));
}

class UtilsManager {
  constructor() {
    this.currentStaticData = {};
    this.gongsMap = new Map();
    this.coursesMap = new Map();

    this.init();
  }

  init() {
    getStaticData(this);
    buildGongsMap(this);
    buildCoursesMap(this);
  }

  refreshData() {
    this.currentStaticData = {};
    this.gongsMap.clear();
    this.coursesMap.clear();
    this.init();
  }
}

module.exports = new UtilsManager();
