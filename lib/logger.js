const moment = require('moment');
const { createLogger, format, transports } = require('winston');

const { combine, printf } = format;

const isProduction = process.env.NODE_ENV === 'production';
const isOverrideProduction = false;

const tsFormat = () => moment().format('YYMM/DD.HH:mm:ss:SSS');

let testMode = false;

const generalFormatter = printf(({ level, message, timeStamp }) => {
  const retValue = `${timeStamp} [${level}]: ${message} : `;
  return retValue;
});

const errorOutput = (aError) => (testMode ? '' : ` Error output:\n ${aError.stack}`);
const getErrorLog = (aError) => `Error : ${aError.message}.${errorOutput(aError)}`;

/**
 *
 * @param {module.Gong} aGong
 * @return {string}
 */
const reformatGongForLog = (aGong) => {
  const dataStrigified = JSON.stringify(aGong);
  const retFormattedGong = `\n\t\tGong: ${dataStrigified} `;
  return retFormattedGong;
};

/**
 *
 * @param {module.Job} aJob
 * @return {string}
 */
const reformatManualGongJobsForLog = (aJob, aExecTime) => {
  const formattedTime = moment(aJob.time).format('YY/MM/DD.HH:mm');
  let formattedExecTimeClause;
  if (aExecTime) {
    const formattedExecTime = moment(aExecTime).format('YY/MM/DD.HH:mm');
    const formattedPlayedTime = moment().format('YY/MM/DD.HH:mm');
    formattedExecTimeClause = `\n\t\t executed:${formattedExecTime} , played:${formattedPlayedTime}`;
  }
  const isManualStr = aJob.isManual ? 'Manual' : ' Automatic';
  const gongData = reformatGongForLog(aJob.data);
  const aJobStatus = aJob.status.description;
  const retFormattedGong = `\n\t\tJob time is ${formattedTime}.${formattedExecTimeClause} \n\t\t Is ${isManualStr}.`
    + ` Status is ${aJobStatus}. ${gongData} `;
  return retFormattedGong;
};

const scheduleManagerFormatter = printf(({ level, message, timeStamp, action, jobs, error }) => {
  let retValue = `${timeStamp} scheduleManager[${level}] : ${message} . Action is : ${action} `;
  if (error) {
    retValue += getErrorLog(error);
  }
  if (jobs) {
    retValue += '\n\tJobs list :';
    const jobsArray = Array.isArray(jobs) ? jobs : [jobs];
    jobsArray.forEach((job) => retValue = retValue.concat(reformatManualGongJobsForLog(job)));
  }
  return retValue;
});

const relayAndSoundManagerFormatter = printf(({ level, message, timeStamp, job, gong, execTime, error }) => {
  let retValue = `${timeStamp} relayAndSoundManager[${level}] : ${message} .`;
  if (error) {
    retValue += getErrorLog(error);
  }
  if (job) {
    retValue += '\n\tJob is :';
    retValue += (reformatManualGongJobsForLog(job, execTime));
  }
  if (gong) {
    retValue += `\n\tGong ${error ? 'NOT' : ''} played ${error ? '(Errors exist)' : ''} is :`;
    retValue += reformatGongForLog(gong);
  }
  return retValue;
});

const timeStampFormatter = format((info) => {
  info.timeStamp = tsFormat();
  return info;
});

const gongConsoleFormat = format((info) => {
  if (info.init === true) return false;
  return info;
});

const reformatCourseForLog = (/* CourseSchedule */aCourseSchedule) => {
  let retFormattedGong = `\n\t\tCourse Id is ${aCourseSchedule.id} . `
    + `Params{ Course name:${aCourseSchedule.course_name} ,`
    + ` date : ${aCourseSchedule.date} , startFromDay : ${aCourseSchedule.startFromDay} }.`;
  const exceptions = aCourseSchedule.exceptions;
  if (exceptions && exceptions.length > 0) {
    retFormattedGong += `\n\t\t\t Exceptions : [${exceptions}]`;
  }
  return retFormattedGong;
};

const reformatManualGongForLog = ({ time, isActive, gong }) => {
  const formattedTime = moment(time).format('YY/MM/DD.HH:mm');
  const isActiveStr = isActive ? '' : ' Not';
  const retFormattedGong = `\n\t\tGong time is ${formattedTime}. Is${isActiveStr} Active.`
    + ` Params{ type : ${gong.gongType} , Areas : [${gong.areas}] , volume : ${gong.volume}}`;
  return retFormattedGong;
};

const gongManagerFormatter = printf(({ level, message, timeStamp, gongs, courses, jobs, error }) => {
  let retValue = `${timeStamp} gongManager[${level}] : ${message} : `;
  if (error) {
    retValue += getErrorLog(error);
  }
  if (courses) {
    retValue += '\n\tCourses list :';
    const coursesArray = Array.isArray(courses) ? courses : [courses];
    coursesArray.forEach((course) => retValue = retValue.concat(`${reformatCourseForLog(course)} \n`));
  }
  if (gongs) {
    retValue += '\n\tGongs list :';
    const gongsArray = Array.isArray(gongs) ? gongs : [gongs];
    gongsArray.forEach((gong) => retValue = retValue.concat(reformatManualGongForLog(gong)));
  }
  if (jobs) {
    retValue += '\n\tJobs list :';
    const jobsArray = Array.isArray(jobs) ? jobs : [jobs];
    jobsArray.forEach((job) => retValue = retValue.concat(reformatManualGongJobsForLog(job)));
  }

  return retValue;
});

const onlyInProductionFormatter = format((info) => {
  if (info.init === true && !isProduction && !isOverrideProduction) return false;
  return info;
});

const forDebugFormatter = format((info) => {
  if (info.level === 'error') {
    console.error('------------------');
    console.error('aaaaa', info.error);
    console.error('------------------');
  }
  return info;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timeStampFormatter(),
    generalFormatter,
  ),
  transports: [
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new transports.File({ filename: 'logs/combined.log' }),
    new (transports.Console)({
      timestamp: tsFormat,
      colorize: true,
    }),
  ],
});

logger.gongsManager = createLogger({
  level: 'info',
  format: combine(
    onlyInProductionFormatter(),
    timeStampFormatter(),
    gongManagerFormatter,
  ),
  transports: [
    new transports.File({
      filename: 'logs/gongManager.log',
      label: 'gongManager',
    }),
    new (transports.Console)({
      timestamp: tsFormat,
      colorize: true,
      format: gongConsoleFormat(),
    }),
  ],
});

logger.scheduleManager = createLogger({
  level: 'info',
  format: combine(
    onlyInProductionFormatter(),
    timeStampFormatter(),
    scheduleManagerFormatter,
  ),
  transports: [
    new transports.File({
      filename: 'logs/scheduleManager.log',
      label: 'scheduleManager',
    }),
    new (transports.Console)({
      timestamp: tsFormat,
      colorize: true,
      format: gongConsoleFormat(),
    }),
  ],
});

logger.relayAndSoundManager = createLogger({
  level: 'info',
  format: combine(
    onlyInProductionFormatter(),
    timeStampFormatter(),
    relayAndSoundManagerFormatter,
  ),
  transports: [
    new transports.File({
      filename: 'logs/relayAndSoundManager.log',
      label: 'relayAndSoundManager',
    }),
    new (transports.Console)({
      timestamp: tsFormat,
      colorize: true,
      format: gongConsoleFormat(),
    }),
  ],
});

logger.setTestMode = () => {
  testMode = true;
};

module.exports = logger;
