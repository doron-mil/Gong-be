const fs = require('fs');
const responder = require('../../lib/responder');

const users = [
  {id: '1', firstName: 'Edd', secondName: 'Yerburgh'},
  {id: '2', firstName: 'Colonel', secondName: 'Mustard'},
];

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
  const rawData = fs.readFileSync(`wassets/data/course_${courseName}.json`);
  const foundCourse = JSON.parse(rawData);
  responder.send200Response(res, foundCourse);
}

module.exports = {
  getAreas,
  getGongTypes,
  getCourses,
  getCourseByName,
  getCoursesSchedule,
};
