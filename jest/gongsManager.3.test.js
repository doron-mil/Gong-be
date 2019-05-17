const fs = require('fs');
const moment = require('moment');
const utilsManager = require('../lib/utilsManager');
const gongsManager = require('../lib/gongsManager');
const logger = require('../lib/logger');

logger.setTestMode();

const dateFormat = 'YYYY-MM-DD';
const validCourseName = '10_day_course';
const validOneDatTestCourseName = 'test3';

const jobActionStubFunction = jest.fn((/* Job */aJobOrJobs, aAction) => {
  // console.log('aaaa', aJobOrJobs.length, aAction);
});

describe('Test gongsManager with Initial setup', () => {
  const currentMoment = moment();

  beforeAll(() => {
    const filesPath = 'jest/data/3';
    const currentHour = currentMoment.hour();
    const currentDateString = currentMoment.format(dateFormat);
    const courseId = currentMoment.clone().startOf('day').valueOf();

    const coursesScheduleObject = [{
      id: courseId,
      course_name: validOneDatTestCourseName,
      date: currentDateString,
      startFromDay: 0,
      testHoursRange: {
        start: currentHour,
        end: currentHour,
      },
    }];

    fs.writeFileSync(`${filesPath}/coursesSchedule.json`, JSON.stringify(coursesScheduleObject));
    gongsManager.setDynamicJsonFilesPath(filesPath);
    gongsManager.addOnGongActionListener(jobActionStubFunction);
  });


  test('Validating course loading', async () => {
    jobActionStubFunction.mockClear();
    gongsManager.init();

    expect(jobActionStubFunction.mock.calls.length).toEqual(1);
    const minutesInTheHour = currentMoment.minute();
    expect(jobActionStubFunction.mock.calls[0][0].length).toEqual(60 - minutesInTheHour - 1);
    expect(jobActionStubFunction.mock.calls[0][1]).toBe('ADD_INIT');
    expect(gongsManager.scheduledCoursesArray.length).toEqual(1);
    expect(gongsManager.automaticGongsMap.size).toEqual(1);
  });


});
