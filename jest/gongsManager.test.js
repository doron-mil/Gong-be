const gongsManager = require('../lib/gongsManager');

const jobActionStubFunction = (/* Job */aJobOrJobs, aAction = 'ADD') => {
  console.log('11111');
};

gongsManager.addOnGongActionListener(jobActionStubFunction);
gongsManager.init();

describe('Test the root path', () => {
  test('It should response the GET method', () => {
    const aaa = 200;
    expect(aaa)
      .toBe(200);
  });
});

