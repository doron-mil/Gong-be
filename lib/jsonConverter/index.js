const moment = require('moment');
const { JsonClassConverter } = require('json-class-converter');

const ManualGong = require('../../model/manualGong');
const Gong = require('../../model/gong');
const Job = require('../../model/job');

const conversionSchema = require('./conversion-schema.json');

const areaConversion = (aAreas) => {
  if (aAreas && aAreas.includes(0) && aAreas.length > 1) {
    return [0];
  }
  return aAreas;
};

const zeroSecondsInTime = (aTime) => {
  const momentTime = moment(aTime);
  if (momentTime.isValid()) {
    momentTime.seconds(0);
    return momentTime.valueOf();
  }
  return undefined;
};

const conversionFunctionsMapArray = [
  {
    methodName: 'areasConversion',
    method: areaConversion,
  }, {
    methodName: 'zeroSecondsInTime',
    method: zeroSecondsInTime,
  },
];

const classesMapArray = [
  {
    className: 'ManualGong',
    clazz: ManualGong,
  },
  {
    className: 'Gong',
    clazz: Gong,
  },
  {
    className: 'Job',
    clazz: Job,
  },
];


const jsonConverterConfiguration = {
  conversionSchema,
  conversionFunctionsMapArray,
  classesMapArray,
};

const jsonClassConverter = new JsonClassConverter(jsonConverterConfiguration);
console.log('bbbbbb', jsonClassConverter);

module.exports = jsonClassConverter;
