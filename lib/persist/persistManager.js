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

async function addOrDeleteNewTopicToLanguageBundles(aTopicValueArray, aTopicName, aIsAdd = true) {
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
            if (aIsAdd) {
              const value = (language === 'en') ? `${newTopicValue}®®®` : '';
              _.set(translation, ['general', 'typesValues', aTopicName, newTopicValue], value);
            } else {
              _.unset(translation, ['general', 'typesValues', aTopicName, newTopicValue]);
            }
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

async function addOrDeleteGongToLanguageBundles(aGongName, aIsAdd = true) {
  return addOrDeleteNewTopicToLanguageBundles([aGongName], 'gongType', aIsAdd);
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
    throw new Error(`${_.upperFirst(aField)} must be a valid string. Current value ${fieldValue}`);
  }
}

function validateValidArray(aArrayJsonForTest) {
  if (!aArrayJsonForTest || !Array.isArray(aArrayJsonForTest) || aArrayJsonForTest.length <= 0) {
    throw new Error('Supposed Array must be valid Array and consist of one or more elements');
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

function persistStaticData(
  aNewCoursesTemplateJson = null, aGong4AddOrDel = null, aUpdatedPermissions = null,
  aIsDelete = false,
) {
  const errorPrefix = 'PersistManager::persistStaticData ERROR.';
  const addOrRemovePromise = new Promise(
    (resolve, reject) => {
      fs.readFile('assets/data/staticData.json', (error, data) => {
        if (error) {
          reject(error);
        } else {
          const currentStaticData = JSON.parse(data);
          let returnObj;

          if (aNewCoursesTemplateJson) {
            currentStaticData.courses = [...aNewCoursesTemplateJson, ...currentStaticData.courses];
            currentStaticData.courses = _.sortBy(currentStaticData.courses, ['course_name']);
          }

          if (aGong4AddOrDel) {
            if (aIsDelete) {
              const removedObjectsArray = _.remove(currentStaticData.gongTypes,
                gongType => gongType.id === aGong4AddOrDel.id);
              if (removedObjectsArray.length === 1) {
                // eslint-disable-next-line prefer-destructuring
                returnObj = removedObjectsArray[0];
              } else {
                const removedObjectsArrayStr = JSON.stringify(removedObjectsArray);
                reject(new Error(`${errorPrefix}. Trying to delete resulted in other than one candidate`
                  + `. candidatesArray : ${removedObjectsArrayStr}`));
              }
            } else {
              _.set(aGong4AddOrDel, 'id', currentStaticData.gongTypes.length + 1);
              currentStaticData.gongTypes = [...currentStaticData.gongTypes, aGong4AddOrDel];
            }
          }

          if (aUpdatedPermissions) {
            _.forEach(currentStaticData.permissions, permission => {
              const foundPermission =
                _.find(aUpdatedPermissions, updatedPermission => updatedPermission.action === permission.action);
              if (foundPermission) {
                _.set(permission, 'roles', foundPermission.roles);
              } else {
                reject(new Error(
                  `${errorPrefix} Failed to find Permissions object : ${permission.action}`));
              }
            });
          }

          currentStaticData.lastUpdatedTime = Date.now();

          persistDataObject('staticData', currentStaticData)
            .then(() => {
              utilsManager.refreshData();
              resolve(returnObj);
            })
            .catch((err) => {
              reject(err);
            });
        }
      });
    });

  return addOrRemovePromise;
}

async function copyGongFile(aNewFileName, aCurrentDownloadPath) {
  return new Promise(
    (resolve, reject) => {
      fs.copyFile(aCurrentDownloadPath, `assets/sounds/${aNewFileName}`, fs.constants.COPYFILE_FICLONE,
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });
}

async function removeGongFile(aGongFileName2Remove) {
  return new Promise(
    (resolve, reject) => {
      fs.unlink(`assets/sounds/${aGongFileName2Remove}`, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
}

async function addNewCoursesPathToLanguageBundles(aNewCoursesTemplateJson) {
  const newCoursesArray = Array.from(aNewCoursesTemplateJson);
  const coursesNamesArray = newCoursesArray.map((newCourse) => _.get(newCourse, 'course_name'));

  return addOrDeleteNewTopicToLanguageBundles(coursesNamesArray, 'courses');
}

function validateNewUserTemplate(aNewUserJson) {
  ['id', 'role', 'password'].forEach(field => validateValidString(aNewUserJson, field));
}

async function persistEditUserTemplate(aStringObj4Errors, aUsersManipulationFunc) {
  return new Promise((resolve, reject) => {
    fs.readFile('assets/data/usersData.json',
      (err, data) => {
        if (err) {
          logger.error(`PersistManager.js=>persistEditUserTemplate(${aStringObj4Errors})`
            + ' Error: Failed to save new user (retrieving existing users)', { error: err });
          reject(err);
        } else {
          const currentUsersData = JSON.parse(data);

          aUsersManipulationFunc(currentUsersData);

          persistDataObject('usersData', currentUsersData)
            .then(() => resolve())
            .catch((error) => {
              logger.error(`PersistManager.js=>persistEditUserTemplate(${aStringObj4Errors})`
                + ' Error: Failed to save new user', { error });
              reject(error);
            });
        }
      });
  });
}

async function persistNewUser(aNewUserJson) {
  return persistEditUserTemplate(`New NUser : ${JSON.stringify(aNewUserJson)}`,
    (currentUsersData) => {
      const newUser = _.pick(aNewUserJson, ['id', 'role']);
      const currentTimeInMSec = moment().valueOf();
      _.set(newUser, 'creation-date', currentTimeInMSec);
      _.set(newUser, 'update-date', currentTimeInMSec);
      _.set(newUser, 'encodedPasswd', bcrypt.hashSync(aNewUserJson.password, 10));
      currentUsersData.push(newUser);
    });
}

async function persistRemoveUser(aUserId4Remove) {
  return persistEditUserTemplate(`User Id 4 removal : ${aUserId4Remove}`,
    (currentUsersData) => {
      _.remove(currentUsersData, (user) => user.id === aUserId4Remove);
    });
}

async function persistUpdateUser(aUser) {
  return persistEditUserTemplate(`User Id 4 update : ${aUser.userId}`,
    (currentUsersData) => {
      const foundUser = currentUsersData.find(user => user.id === aUser.userId);
      if (foundUser) {
        if (aUser.role) {
          _.set(foundUser, 'role', aUser.role);
        } else {
          _.set(foundUser, 'encodedPasswd', bcrypt.hashSync(aUser.password, 10));
        }
        const currentTimeInMSec = moment().valueOf();
        _.set(foundUser, 'update-date', currentTimeInMSec);
      } else {
        throw new Error(`PersistManager=>persistUpdateUser failed for object ${JSON.stringify(aUser)}`);
      }
    });
}

function validatePermissions(aPermissionsArrayJson) {
  validateValidArray(aPermissionsArrayJson);
  _.forEach(aPermissionsArrayJson, (permission) => {
    validateValidString(permission, 'action');
    validateValidArray(permission.roles);
    if (permission.roles.some(role => !['user', 'super-user', 'admin', 'dev'].includes(role))) {
      throw new Error(
        `Roles must be one of ['user', 'super-user', 'admin', 'dev'] for permission : ${permission.action}`);
    }
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

  async addGong(aNewFileName, aCurrentDownloadPath) {
    try {
      const gongName = validateNewGongName(aNewFileName);
      await addOrDeleteGongToLanguageBundles(gongName);
      const newGong = new GongType(0, gongName, aNewFileName);
      await persistStaticData(null, newGong);
      await copyGongFile(aNewFileName, aCurrentDownloadPath);
    } catch (e) {
      return Promise.reject(e);
    }
    return Promise.resolve();
  }

  async deleteGong(aGongId4Delete) {
    try {
      const gongId4DeleteNum = Number(aGongId4Delete);
      if (!aGongId4Delete || !_.isNumber(gongId4DeleteNum)) {
        throw new Error(`PersistManager::deleteGong : Gong id must be a valid number. Current value ${aGongId4Delete}`);
      }
      const dummyGongObj4Del = { id: gongId4DeleteNum };
      const removedGongObj = await persistStaticData(null, dummyGongObj4Del,
        null, true);
      const fileName = removedGongObj.pathName;
      await removeGongFile(fileName);
      await addOrDeleteGongToLanguageBundles(removedGongObj.name, false);
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

  async removeUser(aUserId4Remove) {
    try {
      validateValidString({ aUserId4Remove }, 'aUserId4Remove');
      await persistRemoveUser(aUserId4Remove);
      await persistStaticData();
    } catch (e) {
      return Promise.reject(e);
    }
    return Promise.resolve();
  }

  async updateUser(aUserJson) {
    try {
      ['userId', 'role'].forEach(field => validateValidString(aUserJson, field));
      await persistUpdateUser(aUserJson);
      await persistStaticData();
    } catch (e) {
      return Promise.reject(e);
    }
    return Promise.resolve();
  }

  async resetUserPassword(aUserJson) {
    try {
      ['userId', 'password'].forEach(field => validateValidString(aUserJson, field));
      await persistUpdateUser(aUserJson);
      await persistStaticData();
    } catch (e) {
      return Promise.reject(e);
    }
    return Promise.resolve();
  }

  async updatePermissions(aPermissionsArrayJson) {
    try {
      validatePermissions(aPermissionsArrayJson);
      await persistStaticData(null, null, aPermissionsArrayJson);
    } catch (e) {
      return Promise.reject(e);
    }
    return Promise.resolve();
  }

}

module.exports = new PersistManager();
