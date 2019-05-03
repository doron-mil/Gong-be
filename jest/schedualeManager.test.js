const gongsManager = require('../lib/gongsManager');

const jobActionStubFunction = jest.fn((/* Job */aJobOrJobs, aAction) => {
  console.log('11111', aJobOrJobs.length, aAction);
});


describe.skip('Test gongsManager', () => {
  beforeAll(() => {
    // gongsManager.setDynamicJsonFilesPath('jest/data');
    // gongsManager.addOnGongActionListener(jobActionStubFunction);
    // gongsManager.init();
  });

  test('It should response the GET method', () => {
    const aaa = 200;
    expect(aaa).toBe(200);
    console.log('3333',gongsManager.dynamicJsonFilesPath)
    expect(jobActionStubFunction.mock.calls.length).toBe(1);
  });
});

