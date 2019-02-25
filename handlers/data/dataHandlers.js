const fs = require('fs');
const responder = require('../../lib/responder');
const gongsManager = require('../../lib/gongsManager');

function getAreas(req, res, next) {
  const rawData = fs.readFileSync('assets/data/areas.json');
  const areas = JSON.parse(rawData);
  responder.send200Response(res, areas);
}

function getGongTypes(req, res, next) {
  const rawData = fs.readFileSync('assets/data/gongsTypes.json');
  const gongsTypes = JSON.parse(rawData);
  responder.send200Response(res, gongsTypes);
}

function getCourses(req, res, next) {
  const rawData = fs.readFileSync('assets/data/courses.json');
  const courses = JSON.parse(rawData);
  responder.send200Response(res, courses);
}

function getCoursesSchedule(req, res, next) {
  const rawData = fs.readFileSync('assets/data/coursesSchedule.json');
  const coursesSchedule = JSON.parse(rawData);
  responder.send200Response(res, coursesSchedule);
}

function getCourseByName(req, res, next) {
  const courseName = req.params.name;
  const rawData = fs.readFileSync(`assets/data/course_${courseName}.json`);
  const foundCourse = JSON.parse(rawData);
  responder.send200Response(res, foundCourse);
}

const getManualGongsList = (req, res, next) => {
  const retList = gongsManager.getManualGongsList();
  responder.send200Response(res, retList);
}

function addManualGong(req, res, next) {
  const retStatus = gongsManager.addManualGong(req.body);
  retStatus.then(
    () => {
      responder.send200Response(res, 'SUCCESS');
    }, (err) => {
      responder.sendErrorResponse(res, err.httpStatusCode || 500, 'Error in addManualGong ', err);
    });
}

function scheduleCourse(req, res, next) {
  const retScheduledCoursePromise = gongsManager.addScheduledCourse(req.body);

  retScheduledCoursePromise.then(
    (retScheduledCourse) => {
      responder.send200Response(res, retScheduledCourse);
    }, (err) => {
      responder.sendErrorResponse(res, err.httpStatusCode || 500, 'Error in scheduleCourse ', err);
    });
}

function removeScheduledCourse(req, res, next) {
  const retStatus = gongsManager.removeScheduledCourse(req.body);

  retStatus.then(
    () => {
      responder.send200Response(res, retStatus);
    }, (err) => {
      responder.sendErrorResponse(res, err.httpStatusCode || 500, 'Error in remove scheduledCourse ', err);
    });
}

module.exports = {
  getAreas,
  getGongTypes,
  getCourses,
  getCourseByName,
  getCoursesSchedule,
  getManualGongsList,
  addManualGong,
  scheduleCourse,
  removeScheduledCourse,
};
