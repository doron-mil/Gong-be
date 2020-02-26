const fs = require('fs');
const _ = require('lodash');
const moment = require('moment');
const bcrypt = require('bcrypt');

const utilsManager = require('../utilsManager');
const logger = require('../logger');

const dynamicJsonFilesPath = 'assets/data';
const langsBundlesJsonFilesPath = 'assets/i18n';

const GongType = require('../../model/gongType');


function persistUpdateLanguages(aUpdatedLanguagesJson) {
  const promisesArray = [];

  aUpdatedLanguagesJson.forEach((langStructure) => {
    const { language, translation } = langStructure;

    const transPath = `${langsBundlesJsonFilesPath}/${language}.json`;

    const langPromise = new Promise((resolve, reject) => {
      const resolverFunc = (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      };

      if (translation === {}) {
        fs.unlink(transPath, resolverFunc);
      } else {
        fs.writeFile(transPath, JSON.stringify(translation), resolverFunc);
      }

      promisesArray.push(langPromise);
    });
  });

  return Promise.all(promisesArray);
}

async function addNewTopicToLanguageBundles(aTopicValueArray, aTopicName) {
  return new Promise((resolve, reject) => {
    fs.readdir(langsBundlesJsonFilesPath, async (error, files) => {
      if (error) {
        logger.error('Failed to read language directory', { error });
        reject(error);
      }
      try {
        const translationsStructArray = [];
        files.forEach((file) => {
          const lastDotIndex = file.lastIndexOf('.');
          const language = file.substr(lastDotIndex - 2, 2);
          const rawData = fs.readFileSync(`${langsBundlesJsonFilesPath}/${file}`);
          const translation = JSON.parse(rawData.toString());
          aTopicValueArray.forEach((newTopicValue) => {
            const value = (language === 'en') ? `${newTopicValue}®®®` : '';
            _.set(translation, ['general', 'typesValues', aTopicName, newTopicValue], value);
          });
          translationsStructArray.push({
            language,
            translation,
          });
        });
        await persistUpdateLanguages(translationsStructArray);
        resolve();
      } catch (e) {
        logger.error('Failed to read languages files', { error: e });
        reject(e);
      }
    });
  });
}

/**
 *
 * @param {string} aNewGongName
 */
function validateNewGongName(aNewGongName) {
  if (!_.isString(aNewGongName)) {
    throw new Error('Gong name must be a string');
  }

  const postfixIndex = aNewGongName.lastIndexOf('.');
  if (postfixIndex < 0) {
    throw new Error('Gong file name must have a postfix identifier');
  }
  const gongName = aNewGongName.substring(0, postfixIndex);

  const { gongsMap } = utilsManager;
  const existingGongsArray = Array.from(gongsMap.values());

  if (existingGongsArray.some((gong) => gong.name.toLowerCase() === gongName.toLowerCase())) {
    throw new Error(`Gong ${gongName} already exist`);
  }

  return gongName;
}

async function addNewGongToLanguageBundles(aGongName) {
  return addNewTopicToLanguageBundles([aGongName], 'gongType');
}

function validateLanguagesTemplate(aUpdatedLanguagesJson) {
  if (!Array.isArray(aUpdatedLanguagesJson)) {
    throw new Error('Template must consist of an array of objects');
  }
  if (aUpdatedLanguagesJson.some((langStructure) => !langStructure.language || aUpdatedLanguagesJson.translation)) {
    throw new Error('Each element in the template array should have : language and translation');
  }
}

function validateCoursesTemplate(aNewCoursesTemplateJson) {
  if (!Array.isArray(aNewCoursesTemplateJson)) {
    throw new Error('Template must consist of an array of objects');
  }

  const newCoursesArray = Array.from(aNewCoursesTemplateJson);

  const { coursesMap } = utilsManager;
  const existingCoursesNamesArray = Array.from(coursesMap.keys());

  const regexp4Time = new RegExp('^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$');

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
      if (_.isNil(type) || !_.isNumber(type)) {
        throw new Error('All courses must have type attribute consist of a number');
      }

      const volume = _.get(gongs, 'volume');
      if (volume && !_.isNumber(volume)) {
        throw new Error('All courses can have volume attribute consist of a number');
      }
    }); // End of agendaArray.forEach
  });// End of newCoursesArray.forEach
}

function validateValidString(aObject, aField) {
  const fieldValue = _.get(aObject, aField);
  if (!fieldValue || !_.isString(fieldValue) || fieldValue.trim().length <= 0) {
    throw new Error(`${_.upperFirst(fieldValue)} must be a valid string`);
  }
}

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

function persistStaticData(aNewCoursesTemplateJson = null, aNewGong = null) {
  const currentStaticRawData = fs.readFileSync('assets/data/staticData.json');
  const currentStaticData = JSON.parse(currentStaticRawData);

  if (aNewCoursesTemplateJson) {
    currentStaticData.courses = [...aNewCoursesTemplateJson, ...currentStaticData.courses];
    currentStaticData.courses = _.sortBy(currentStaticData.courses, ['course_name']);
  }

  if (aNewGong) {
    _.set(aNewGong, 'id', currentStaticData.gongTypes.length + 1);
    currentStaticData.gongTypes = [...currentStaticData.gongTypes, aNewGong];
  }

  currentStaticData.lastUpdatedTime = Date.now();

  return persistDataObject('staticData', currentStaticData).then(() => utilsManager.refreshData());
}

async function addNewCoursesPathToLanguageBundles(aNewCoursesTemplateJson) {
  const newCoursesArray = Array.from(aNewCoursesTemplateJson);
  const coursesNamesArray = newCoursesArray.map((newCourse) => _.get(newCourse, 'course_name'));

  return addNewTopicToLanguageBundles(coursesNamesArray, 'courses');
}

function validateNewUserTemplate(aNewUserJson) {
  ['id', 'role', 'password'].forEach(field => validateValidString(aNewUserJson, field));
}

async function persistNewUser(aNewUserJson) {
  return new Promise((resolve, reject) => {
    fs.readFile('assets/data/usersData.json',
      (err, data) => {
        if (err) {
          logger.error(`PersistManager.js=>persistNewUser(${JSON.stringify(aNewUserJson)})`
            + ' Error: Failed to save new user (retrieving existing users)', { error: err });
          reject(err);
        } else {
          const currentUsersData = JSON.parse(data);

          const newUser = _.pick(aNewUserJson, ['id', 'role']);
          const currentTimeInMSec = moment().valueOf();
          _.set(newUser, 'creation-date', currentTimeInMSec);
          _.set(newUser, 'update-date', currentTimeInMSec);
          _.set(newUser, 'encodedPasswd', bcrypt.hashSync(aNewUserJson.password, 10));
          currentUsersData.push(newUser);

          persistDataObject('usersData', currentUsersData)
            .then(() => resolve())
            .catch((error) => {
              logger.error(`PersistManager.js=>persistNewUser(${JSON.stringify(aNewUserJson)})`
                + ' Error: Failed to save new user', { error });
              reject(error);
            });
        }
      });
  });
}

class PersistManager {
  /**
   *
   * @param aNewCoursesTemplatesJson
   * @return {Promise<void>}
   */
  async addCoursesTemplates(aNewCoursesTemplateJson) {
    try {
      validateCoursesTemplate(aNewCoursesTemplateJson);
      await addNewCoursesPathToLanguageBundles(aNewCoursesTemplateJson);
      await persistStaticData(aNewCoursesTemplateJson);
    } catch (e) {
      return Promise.reject(e);
    }
    return Promise.resolve();
  }

  async addGong(aNewFileName) {
    try {
      const gongName = validateNewGongName(aNewFileName);
      await addNewGongToLanguageBundles(gongName);
      const newGong = new GongType(0, gongName, aNewFileName);
      await persistStaticData(null, newGong);
    } catch (e) {
      return Promise.reject(e);
    }
    return Promise.resolve();
  }

  async updateLanguages(aUpdatedLanguagesJson) {
    try {
      validateLanguagesTemplate(aUpdatedLanguagesJson);
      await persistUpdateLanguages(aUpdatedLanguagesJson);
      await persistStaticData();
    } catch (e) {
      return Promise.reject(e);
    }
    return Promise.resolve();
  }

  async addUser(aNewUserJson) {
    try {
      validateNewUserTemplate(aNewUserJson);
      await persistNewUser(aNewUserJson);
      await persistStaticData();
    } catch (e) {
      return Promise.reject(e);
    }
    return Promise.resolve();
  }

}

module.exports = new PersistManager();
