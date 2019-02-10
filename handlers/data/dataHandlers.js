const fs = require('fs');
const responder = require('../../lib/responder');
const manualGongsManager = require('../../lib/gongsManager');

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
  const retList = manualGongsManager.getManualGongsList();
  responder.send200Response(res, retList);
}

function addManualGong(req, res, next) {
  const retStatus = manualGongsManager.addManualGong(req.body);
  retStatus.then(
    () => {
      responder.send200Response(res, 'SUCCESS');
    }, (err) => {
      responder.sendErrorResponse(res, err.httpStatusCode || 500, 'Error in addManualGong ', err);
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
};
