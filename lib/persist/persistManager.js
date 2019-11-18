const fs = require('fs');
const _ = require('lodash');

const utilsManager = require('../utilsManager');
const logger = require('../logger');

function validateCoursesTemplate(aNewCoursesTemplateJson) {
  if (!Array.isArray(aNewCoursesTemplateJson)) {
    throw new Error('Template must consist of an array of objects');
  }

  const newCoursesArray = Array.from(aNewCoursesTemplateJson);

  const { coursesMap } = utilsManager;
  const existingCoursesNamesArray = Array.from(coursesMap.keys());

  const regexp4Time = new RegExp('^([0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$');

  newCoursesArray.forEach((newCourse) => {
    const courseName = _.get(newCourse, 'course_name');
    if (!courseName || !_.isString(courseName)) {
      throw new Error('All courses must have course_name attribute with string value');
    }

    if (existingCoursesNamesArray.includes(courseName)) {
      throw new Error(`Course ${courseName} already exist`);
    }

    const daysCount = _.get(newCourse, 'days_count');
    if (!daysCount || !_.isNumber(daysCount)) {
      throw new Error('All courses must have days_count attribute with number value');
    }

    const courseAgenda = _.get(newCourse, 'course_agenda');
    if (!courseAgenda || !Array.isArray(courseAgenda)) {
      throw new Error('All courses must have course_agenda attribute consist of array');
    }

    const agendaArray = Array.from(courseAgenda);
    agendaArray.forEach((agendaProperty) => {
      const days = _.get(agendaProperty, 'days');
      if (!days || !Array.isArray(days) || Array.from(days).some(day => !_.isNumber(day))) {
        throw new Error('All courses must have days attribute consist of array of numbers');
      }

      const gongs = _.get(agendaProperty, 'gongs');
      if (!gongs) {
        throw new Error('All courses must have gongs attribute consist of a parent object');
      }

      const times = _.get(gongs, 'times');
      let badTime;
      if (!times || !Array.isArray(times) || Array.from(times).some(time => !_.isString(time))
        || Array.from(times).some(time => {
          const test = regexp4Time.test(String(time));
          if (!test) badTime = time;
          return !test;
        })) {
        throw new Error(`All courses must have times attribute consist of array of stings in the format 'HH:MM'`
          + ` ()${badTime}`);
      }

      const areas = _.get(gongs, 'areas');
      if (!areas || !Array.isArray(areas) || Array.from(areas).some(area => !_.isNumber(area))) {
        throw new Error('All courses must have areas attribute consist of array of numbers');
      }

      const type = _.get(gongs, 'type');
      if (!type || !_.isNumber(type)) {
        throw new Error('All courses must have type attribute consist of a number');
      }

      const volume = _.get(gongs, 'volume');
      if (volume && !_.isNumber(volume)) {
        throw new Error('All courses can have volume attribute consist of a number');
      }
    }); // End of agendaArray.forEach
  });// End of newCoursesArray.forEach
}

const dynamicJsonFilesPath = 'assets/data';

function persistDataObject(aDataContainerDataName, aJsonObject, aOnResolve, aOnReject) {
  return new Promise(
    (resolve, reject) => {
      fs.writeFile(`${dynamicJsonFilesPath}/${aDataContainerDataName}.json`,
        JSON.stringify(aJsonObject),
        (err) => {
          if (err) {
            logger.error(`PersistManager.js=>persistDataObject(${aDataContainerDataName})`
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
}

function persistNewCourses(aNewCoursesTemplateJson) {
  const currentCoursesRawData = fs.readFileSync('assets/data/courses.json');
  const currentCourses = JSON.parse(currentCoursesRawData);
  const newCoursesArray = [...aNewCoursesTemplateJson, ...currentCourses];

  return persistDataObject('courses', newCoursesArray).then(() => utilsManager.updateCourses());
}

class PersistManager {
  /**
   *
   * @param aNewCoursesTemplatesJson
   * @return {Promise<void>}
   */
  addCoursesTemplates(aNewCoursesTemplateJson) {
    try {
      validateCoursesTemplate(aNewCoursesTemplateJson);
      return persistNewCourses(aNewCoursesTemplateJson);
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

module.exports = new PersistManager();
