const fs = require('fs');
const moment = require('moment');
const gongsManager = require('../lib/gongsManager');
const logger = require('../lib/logger');

logger.setTestMode();

const jobActionStubFunction = jest.fn((/* Job */aJobOrJobs, aAction) => {
  // console.log('11111', aJobOrJobs.length, aAction);
});


describe('Test gongsManager - Handling Manual Gongs', () => {
  beforeAll(() => {
    const filesPath = 'jest/data/1';
    fs.writeFileSync(`${filesPath}/obsoleteManualGong.json`, '[]');
    fs.writeFileSync(`${filesPath}/manualGong.json`, '[]');
    fs.writeFileSync(`${filesPath}/coursesSchedule.json`, '[]');
    gongsManager.setDynamicJsonFilesPath(filesPath);
    gongsManager.addOnGongActionListener(jobActionStubFunction);
    gongsManager.init();
  });

  const addManualGongFailedTestFn = (aManualGongJson, aTestDescription) => {
    test(aTestDescription, async () => {
      expect.assertions(5);
      try {
        await gongsManager.addManualGong(aManualGongJson);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
      expect(jobActionStubFunction.mock.calls.length).toBe(0);
      expect(gongsManager.manualGongArray.length).toBe(0);
      expect(gongsManager.scheduledCoursesArray.length).toBe(0);
      expect(gongsManager.automaticGongsMap.size).toBe(0);
    });
  };

  const addManualGongSuccessTestFn = (aTime, aIterationNumber) => {
    test(`Success of addManualGong no ${aIterationNumber}`, async () => {
      expect.assertions(1);
      const manualGong = {
        time: aTime,
        gong: {
          areas: [1, 2],
          gongType: 1,
        },
      };
      const wasAddingSuccess = await gongsManager.addManualGong(manualGong);
      expect(wasAddingSuccess).toEqual(true);
    });
  };

  const removeManualGongFailedTestFn = (aManualGongJson, aTestDescription) => {
    test(aTestDescription, async () => {
      expect.assertions(5);
      try {
        await gongsManager.removeManualGong(aManualGongJson);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
      expect(jobActionStubFunction.mock.calls.length).toMatchSnapshot();
      expect(gongsManager.manualGongArray.length).toMatchSnapshot();
      expect(gongsManager.scheduledCoursesArray.length).toBe(0);
      expect(gongsManager.automaticGongsMap.size).toBe(0);
    });
  };


  test('Initial state', () => {
    expect.assertions(4);
    expect(jobActionStubFunction.mock.calls.length).toBe(0);
    expect(gongsManager.manualGongArray.length).toBe(0);
    expect(gongsManager.scheduledCoursesArray.length).toBe(0);
    expect(gongsManager.automaticGongsMap.size).toBe(0);
  });

  describe('Handling of adding an invalid Manual Gong ', () => {
    addManualGongFailedTestFn(null, 'Null object');
    let manualGong = {};
    addManualGongFailedTestFn(manualGong, 'Empty object');
    const validTimeForGong = moment().add(1, 'd').valueOf();
    manualGong = {
      time: validTimeForGong,
    };
    addManualGongFailedTestFn(manualGong, 'No gong');
    manualGong = {
      gong: {
        areas: [1, 2],
        gongType: 1,
      },
    };
    addManualGongFailedTestFn(manualGong, 'No time');
    manualGong = {
      time: validTimeForGong,
      gong: {
        gongType: 1,
      },
    };
    addManualGongFailedTestFn(manualGong, 'No Areas');
    manualGong = {
      time: validTimeForGong,
      gong: {
        gongType: 1,
      },
    };
    addManualGongFailedTestFn(manualGong, 'No AreasGong Types');
    manualGong = {
      time: validTimeForGong,
      gong: {
        areas: [1, 2],
      },
    };
    addManualGongFailedTestFn(manualGong, 'No Gong Type');
    manualGong = {
      time: validTimeForGong,
      gong: {
        areas: [],
        gongType: 1,
      },
    };
    addManualGongFailedTestFn(manualGong, 'Empty Ares');
    manualGong = {
      time: validTimeForGong,
      gong: {
        areas: 888,
        gongType: 1,
      },
    };
    addManualGongFailedTestFn(manualGong, 'Invalid areas type');
    manualGong = {
      time: validTimeForGong,
      gong: {
        areas: ['aaa'],
        gongType: 1,
      },
    };
    addManualGongFailedTestFn(manualGong, 'Invalid areas type');
    manualGong = {
      time: 'aa',
      gong: {
        areas: [1, 2],
        gongType: 1,
      },
    };
    addManualGongFailedTestFn(manualGong, 'Invalid time');
    manualGong = {
      time: 333,
      gong: {
        areas: [1, 2],
        gongType: 1,
      },
    };
    addManualGongFailedTestFn(manualGong, 'Time before now');
    manualGong = {
      time: 'aaaa',
      gong: {
        areas: [1, 2],
        gongType: 1,
      },
    };
    addManualGongFailedTestFn(manualGong, 'Invalid Time');
  });

  describe('Validating for sorting the manualGongArray ', () => {
    // expect.assertions(10);
    for (let i = 0; i < 10; i++) {
      const validTimeForGong = moment().add(Math.floor(Math.random() * 1000 + 10), 'd').valueOf();
      addManualGongSuccessTestFn(validTimeForGong.valueOf(), i + 1);
    }

    test('Summary and sorting', () => {
      expect(jobActionStubFunction.mock.calls.length).toBe(10);
      expect(gongsManager.manualGongArray.length).toBe(10);
      let lastGong = { time: 0 };
      gongsManager.manualGongArray.forEach(gong => {
        expect(gong.time).toBeGreaterThanOrEqual(lastGong.time);
        lastGong = gong;
      });
      expect(gongsManager.scheduledCoursesArray.length).toBe(0);
      expect(gongsManager.automaticGongsMap.size).toBe(0);
    });
  });

  describe('Removing Manual Gong ', () => {
    removeManualGongFailedTestFn(null, 'Null object');
    let manualGong = {};
    removeManualGongFailedTestFn(manualGong, 'Empty object');
    manualGong = {
      gong: {
        areas: [1, 2],
        gongType: 1,
      },
    };
    removeManualGongFailedTestFn(manualGong, 'No time');
    manualGong = {
      time: 'aaa',
    };
    removeManualGongFailedTestFn(manualGong, 'Invalid time');
    let validTimeForGong = moment();
    manualGong = {
      time: validTimeForGong.valueOf(),
    };
    removeManualGongFailedTestFn(manualGong, 'Non existing manual gong');

    test('Success removing', async () => {
      validTimeForGong = gongsManager.manualGongArray[4].time;
      manualGong = {
        time: validTimeForGong.valueOf(),
      };
      const wasRemovingSuccess = await gongsManager.removeManualGong(manualGong);
      expect(wasRemovingSuccess).toEqual(true);

      expect(jobActionStubFunction.mock.calls.length).toBe(11);
      expect(gongsManager.manualGongArray.length).toBe(9);
      expect(gongsManager.scheduledCoursesArray.length).toBe(0);
      expect(gongsManager.automaticGongsMap.size).toBe(0);
    });
  });

});
