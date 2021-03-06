const fs = require('fs');
const moment = require('moment');
const responder = require('../../lib/responder');

const authenticateFunc = require('../../auth/authenticate');
const scheduleManager = require('../../lib/scheduleManager');


const authenticate = async (req, res, next) => {
  const token = await authenticateFunc({
    username: req.body.username,
    password: req.body.password,
  });
  if (token) {
    responder.send200Response(res, { token });
  } else {
    responder.sendErrorResponse(res, 400, 'Username or password is incorrect');
  }
};

const getNextGong = (req, res, next) => {
  const rawData = fs.readFileSync('assets/data/staticData.json');
  const { lastUpdatedTime } = JSON.parse(rawData.toString());

  const nextScheduledJob = scheduleManager.getNextScheduledJob();
  const currentServerTime = moment().valueOf();
  const retObject = {
    currentServerTime,
    nextScheduledJob,
    staticDataLastUpdateTime: lastUpdatedTime,
  };
  responder.send200Response(res, retObject);
};


module.exports = {
  authenticate,
  getNextGong,
};
