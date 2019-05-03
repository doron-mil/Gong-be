const fs = require('fs');
const moment = require('moment');
const gongsManager = require('../lib/gongsManager');
const logger = require('../lib/logger');

logger.setTestMode();

const dateFormat = 'YYYY-MM-DD';
const validCourseName = '10_day_course';

const jobActionStubFunction = jest.fn((/* Job */aJobOrJobs, aAction) => {
  // console.log('aaaa', aJobOrJobs.length, aAction);
});

describe('Test gongsManager courses hanling', () => {
  let courseDaysCount;

  beforeAll(() => {
    const filesPath = 'jest/data/1';
    fs.writeFileSync(`${filesPath}/coursesSchedule.json`, '[]');
    gongsManager.setDynamicJsonFilesPath(filesPath);
    gongsManager.addOnGongActionListener(jobActionStubFunction);
    gongsManager.init();
    jobActionStubFunction.mockClear();
  });

  const addCourseFailedFn = async (aCourseJson) => {
    let retValue;
    try {
      retValue = await gongsManager.addScheduledCourse(aCourseJson);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      throw e;
    }
    return retValue;
  };

  const removeCourseFn = async (aCourse4RemoalJson) => {
    let retValue;
    try {
      retValue = await gongsManager.removeScheduledCourse(aCourse4RemoalJson);
    } catch (e) {
      throw e;
    }
    return retValue;
  };

  const removeCourseFailedTestFn = (aCourse4RemoalJson, aTestDescription) => {
    test(aTestDescription, async () => {
      const noOfCoursesBeforeRemove = gongsManager.scheduledCoursesArray.length;
      jobActionStubFunction.mockClear();
      expect.assertions(4);

      await expect(removeCourseFn(aCourse4RemoalJson)).rejects.toThrow();

      expect(jobActionStubFunction.mock.calls.length).toBe(0);
      expect(gongsManager.scheduledCoursesArray.length).toEqual(noOfCoursesBeforeRemove);
      expect(gongsManager.automaticGongsMap.size).toEqual(noOfCoursesBeforeRemove);
    });
  };

  const addCourseFailedTestFn = (aCourseJson, aTestDescription) => {
    test(aTestDescription, async () => {
      jobActionStubFunction.mockClear();
      expect.assertions(4);

      await expect(gongsManager.addScheduledCourse(aCourseJson)).rejects.toThrow();

      expect(jobActionStubFunction.mock.calls.length).toBe(0);
      expect(gongsManager.scheduledCoursesArray.length).toMatchSnapshot();
      expect(gongsManager.automaticGongsMap.size).toMatchSnapshot();
    });
  };

  describe('Failed courses addition ', () => {
    beforeAll(() => {
      const course = gongsManager.coursesMap.get(validCourseName);
      courseDaysCount = course.daysCount;
    });

    addCourseFailedTestFn(null, 'Null object');

    let scheduledCourseJson = {};
    addCourseFailedTestFn(scheduledCourseJson, 'Empty object');

    const validTimeForCourse = moment();
    scheduledCourseJson = {
      date: validTimeForCourse.format(dateFormat),
    };
    addCourseFailedTestFn(scheduledCourseJson, 'No Course name');

    scheduledCourseJson = {
      course_name: 'aaa',
    };
    addCourseFailedTestFn(scheduledCourseJson, 'No time');

    scheduledCourseJson = {
      course_name: validCourseName,
      date: 'aaaa',
    };
    addCourseFailedTestFn(scheduledCourseJson, 'Invalid time');

    scheduledCourseJson = {
      course_name: validCourseName,
      date: validTimeForCourse.clone().subtract(1, 'y').format(dateFormat),
    };
    addCourseFailedTestFn(scheduledCourseJson, 'Past time');

  });

  test('Valid courses addition', async () => {
    const currentMoment = moment();
    const dateStr = currentMoment.format(dateFormat);
    const scheduledCourseJson = {
      course_name: validCourseName,
      date: dateStr,
    };

    const addScheduledCourseSuccess = await gongsManager.addScheduledCourse(scheduledCourseJson);
    expect(addScheduledCourseSuccess).toMatchSnapshot({
      id: expect.any(Number),
      date: expect.any(String),
    });
    expect(jobActionStubFunction.mock.calls.length).toMatchSnapshot();
    expect(gongsManager.scheduledCoursesArray.length).toEqual(1);
    expect(gongsManager.automaticGongsMap.size).toEqual(1);
  });

  describe('Check for collision ', () => {
    let validTimeForCourse;
    let scheduledCourseJson;
    beforeAll(() => {
      validTimeForCourse = moment();
    });
    beforeEach(() => jobActionStubFunction.mockClear());

    test('Adding/Subtracting days - check for fail ', async () => {
      expect.assertions(27);

      for (let i = 0; i < courseDaysCount; i++) {
        scheduledCourseJson = {
          course_name: validCourseName,
          date: validTimeForCourse.clone().add(i, 'd').format(dateFormat),
        };
        await expect(gongsManager.addScheduledCourse(scheduledCourseJson)).rejects.toThrow();

        scheduledCourseJson = {
          course_name: validCourseName,
          date: validTimeForCourse.clone().subtract(i, 'd').format(dateFormat),
        };
        await expect(gongsManager.addScheduledCourse(scheduledCourseJson)).rejects.toThrow();
      }
      expect(jobActionStubFunction.mock.calls.length).toBe(0);
      expect(gongsManager.scheduledCoursesArray.length).toMatchSnapshot();
      expect(gongsManager.automaticGongsMap.size).toMatchSnapshot();
    });

    test('Subtracting days - check for failure - before current time ', async () => {
      expect.assertions(4);
      scheduledCourseJson = {
        course_name: validCourseName,
        date: validTimeForCourse.clone().subtract(courseDaysCount, 'd').format(dateFormat),
      };
      await expect(gongsManager.addScheduledCourse(scheduledCourseJson)).rejects.toThrow();

      expect(jobActionStubFunction.mock.calls.length).toBe(0);
      expect(gongsManager.scheduledCoursesArray.length).toMatchSnapshot();
      expect(gongsManager.automaticGongsMap.size).toMatchSnapshot();
    });

    test('Adding days - check for success ', async () => {
      scheduledCourseJson = {
        course_name: validCourseName,
        date: validTimeForCourse.clone().add(courseDaysCount, 'd').format(dateFormat),
      };
      const addedCourse = await addCourseFailedFn(scheduledCourseJson);
      expect(addedCourse).toBeTruthy();

      expect(jobActionStubFunction.mock.calls.length).toBeGreaterThan(0);
      expect(jobActionStubFunction.mock.calls.length).toMatchSnapshot();
      expect(gongsManager.scheduledCoursesArray.length).toMatchSnapshot();
      expect(gongsManager.automaticGongsMap.size).toMatchSnapshot();
    });
  });

  describe('Removing courses ', () => {
    let validTimeForCourse;
    let scheduledCourse4RemovalJson;
    beforeAll(() => {
      validTimeForCourse = moment();
    });
    beforeEach(() => jobActionStubFunction.mockClear());

    describe('Failed removing courses ', () => {
      removeCourseFailedTestFn(null, 'Null object');
      scheduledCourse4RemovalJson = {};
      removeCourseFailedTestFn(scheduledCourse4RemovalJson, 'Empty object');
      scheduledCourse4RemovalJson = {
        id: 'aaaa',
      };
      removeCourseFailedTestFn(scheduledCourse4RemovalJson, 'Invalid id');
      scheduledCourse4RemovalJson = {
        id: 3333,
      };
      removeCourseFailedTestFn(scheduledCourse4RemovalJson, 'Id that do not exists');
    });

    test('Successed removing courses ', async () => {
      const noOfCoursesBeforeRemove = gongsManager.scheduledCoursesArray.length;
      scheduledCourse4RemovalJson = {
        id: moment().startOf('day').valueOf(),
      };
      const removeResult = await removeCourseFn(scheduledCourse4RemovalJson)
      expect(removeResult).toEqual('SUCCESS');
      expect(gongsManager.scheduledCoursesArray.length).toEqual(noOfCoursesBeforeRemove - 1);
      expect(gongsManager.automaticGongsMap.size).toEqual(noOfCoursesBeforeRemove - 1);
    });
  });


});
