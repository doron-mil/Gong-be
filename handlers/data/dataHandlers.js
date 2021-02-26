const fs = require('fs');
const { IncomingForm } = require('formidable');
const jwt = require('jsonwebtoken');

const responder = require('../../lib/responder');
const gongsManager = require('../../lib/gongsManager');
const persistManager = require('../../lib/persist/persistManager');
const utilsManager = require('../../lib/utilsManager');
const logger = require('../../lib//logger');

const NO_OF_PORTS = process.env.NO_OF_PORTS ? Number.parseInt(process.env.NO_OF_PORTS, 10) : 4;

function getStaticData(req, res, next) {
  let rawData = fs.readFileSync('assets/data/staticData.json');
  const staticData = JSON.parse(rawData.toString());

  staticData.areas = staticData.areas.filter((value, index) => index <= NO_OF_PORTS);

  fs.readdir('assets/i18n', (error, files) => {
    if (error) {
      const newErr = new Error('Failed to read language directory');
      responder.sendErrorResponse(res, 500, 'Error in uploadCourses ', newErr, req);
      logger.error('Failed to read language directory', { error });
    }
    try {
      const languageObj = [];
      files.forEach((file) => {
        rawData = fs.readFileSync(`assets/i18n/${file}`);
        const lastDotIndex = file.lastIndexOf('.');
        const language = file.substr(lastDotIndex - 2, 2);
        languageObj.push({
          language,
          translation: JSON.parse(rawData.toString()),
        });
      });
      staticData.languages = languageObj;

      responder.send200Response(res, staticData);
    } catch (e) {
      const newErr = new Error('Failed to read languages files');
      responder.sendErrorResponse(res, 500, 'Error in uploadCourses ', newErr, req);
      logger.error('Failed to read languages files', { error: e });
    }
  });
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
};

const getUsersList = (req, res, next) => {
  const authorization = req.headers.authorization.split(' ')[1];
  const { sub } = jwt.decode(authorization);
  const retUsersList = utilsManager.getUsers(sub);
  responder.send200Response(res, retUsersList);
};

function addManualGong(req, res, next) {
  const retStatus = gongsManager.addManualGong(req.body);
  retStatus.then(
    () => {
      responder.send200Response(res, 'SUCCESS');
    }, (err) => {
      responder.sendErrorResponse(res, err.httpStatusCode || 500, 'Error in addManualGong ', err);
    });
}

function toggleGong(req, res, next) {
  const retStatus = gongsManager.toggleGong(req.body);
  retStatus.then(
    () => {
      responder.send200Response(res, 'SUCCESS');
    }, (err) => {
      responder.sendErrorResponse(res, err.httpStatusCode || 500, 'Error in toggleGong ', err);
    });
}

function removeGong(req, res, next) {
  const retStatus = gongsManager.removeManualGong(req.body);
  retStatus.then(
    () => {
      responder.send200Response(res, 'SUCCESS');
    }, (err) => {
      responder.sendErrorResponse(res, err.httpStatusCode || 500, 'Error in removeGong ', err);
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

function uploadCourses(req, res, next) {
  const form = new IncomingForm();

  form.on('file', (field, file) => {

    fs.readFile(file.path, async (err, data) => {
      if (err) {
        const newErr = new Error('Failed to read file');
        responder.sendErrorResponse(res, 500, 'Error in uploadCourses ', newErr, req);
        logger.error('uploadCourses Failed', { error: err });
      } else {
        let newCoursesTemplateJson;
        try {
          newCoursesTemplateJson = JSON.parse(data);
        } catch (e) {
          const newErr = new Error('Parsing the recieved file failed - check that it is a JSON');
          responder.sendErrorResponse(res, 500, 'Error in uploadCourses ', newErr, req);
          logger.error('uploadCourses Failed', { error: e });
          return;
        }

        try {
          await persistManager.addCoursesTemplates(newCoursesTemplateJson);
          responder.send200Response(res);
        } catch (e) {
          responder.sendErrorResponse(res, 500, 'Error in uploadCourses ', e, req);
          logger.error('uploadCourses Failed', { error: e });
        }
      }
    });
  });

  form.on('error', (err) => {
    const newErr = new Error('Failed on processing the file');
    responder.sendErrorResponse(res, 500, 'Error in uploadCourses ', newErr);
    logger.error('uploadCourses Failed', { error: err });
  });

  form.on('end', () => {
    logger.info('uploadCourses : Upload ended');
  });

  form.parse(req);
}

async function removeCourse(req, res, next) {
  try {
    await persistManager.deleteCoursesTemplates(req.body.courseName);
    responder.send200Response(res);
  } catch (e) {
    responder.sendErrorResponse(res, 500, 'Error in uploadCourses ', e, req);
    logger.error('uploadCourses Failed', { error: e });
  }
}

function uploadGong(req, res, next) {
  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      responder.sendErrorResponse(res, 500, 'Error in uploadGong ', err);
    } else {
      try {
        const { file } = files;
        const { gongId } = fields;
        await persistManager.addOrUpdateGong(file.name, file.path, gongId);
        responder.send200Response(res);
      } catch (e) {
        responder.sendErrorResponse(res, 500, 'Error in uploadGong ', e, req);
        logger.error('uploadCourses Failed', { error: e });
      }
    }
  });

  form.on('error', (err) => {
    const newErr = new Error('Failed on processing the file');
    responder.sendErrorResponse(res, 500, 'Error in uploadGong ', newErr);
    logger.error('uploadGong Failed', { error: err });
  });

  form.on('end', () => {
    logger.info('uploadGong : Upload ended');
  });
}

async function deleteGongFile(req, res, next) {
  try {
    await persistManager.deleteGong(req.body.gongId);
    responder.send200Response(res);
  } catch (e) {
    responder.sendErrorResponse(res, 500, 'Error in uploadGong ', e, req);
    logger.error('uploadCourses Failed', { error: e });
  }
}

function languagesUpdate(req, res, next) {
  const retLanguagesUpdatePromise = persistManager.updateLanguages(req.body);

  retLanguagesUpdatePromise.then(
    () => {
      responder.send200Response(res, true);
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

async function addUser(req, res, next) {
  try {
    await persistManager.addUser(req.body);
    responder.send200Response(res);
  } catch (e) {
    responder.sendErrorResponse(res, 500, 'Error in addUser ', e, req);
    logger.error('addUser Failed', { error: e });
  }
}

async function removeUser(req, res, next) {
  try {
    await persistManager.removeUser(req.body.userId);
    responder.send200Response(res);
  } catch (e) {
    responder.sendErrorResponse(res, 500, 'Error in removeUser ', e, req);
    logger.error('removeUser Failed', { error: e });
  }
}

async function updateUser(req, res, next) {
  try {
    await persistManager.updateUser(req.body);
    responder.send200Response(res);
  } catch (e) {
    responder.sendErrorResponse(res, 500, 'Error in updateUser ', e, req);
    logger.error('updateUser Failed', { error: e });
  }
}

async function resetUserPassword(req, res, next) {
  try {
    await persistManager.resetUserPassword(req.body);
    responder.send200Response(res);
  } catch (e) {
    responder.sendErrorResponse(res, 500, 'Error in resetUserPassword ', e, req);
    logger.error('resetUserPassword Failed', { error: e });
  }
}

async function updatePermissions(req, res, next) {
  try {
    await persistManager.updatePermissions(req.body);
    responder.send200Response(res);
  } catch (e) {
    responder.sendErrorResponse(res, 500, 'Error in updatePermissions ', e, req);
    logger.error('updatePermissions Failed', { error: e });
  }
}

module.exports = {
  getStaticData,
  getCourseByName,
  getCoursesSchedule,
  getManualGongsList,
  getUsersList,
  addManualGong,
  toggleGong,
  removeGong,
  scheduleCourse,
  uploadCourses,
  removeCourse,
  uploadGong,
  deleteGongFile,
  languagesUpdate,
  removeScheduledCourse,
  addUser,
  removeUser,
  updateUser,
  resetUserPassword,
  updatePermissions,
};
