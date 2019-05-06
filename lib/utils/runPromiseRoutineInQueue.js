/* eslint-disable no-use-before-define,no-param-reassign */

const runPromiseRoutine = (aQueueObject, aFuncPayload, aResolve, aReject) => {
  aQueueObject.functionForCommand(aFuncPayload)
    .then((result) => aResolve(result))
    .catch((error) => aReject(error))
    .finally(() => handleQueue(aQueueObject));
};

const handleQueue = (aQueueObject) => {
  if (aQueueObject.promisesQueue.length <= 0) {
    aQueueObject.isQueueHandled = false;
    return;
  }

  const { payload, resolve, reject } = aQueueObject.promisesQueue.pop();

  runPromiseRoutine(aQueueObject, payload, resolve, reject);
};

const startHandlingQueue = (aQueueObject) => {
  if (aQueueObject.isQueueHandled) {
    return;
  }
  aQueueObject.isQueueHandled = true;
  handleQueue(aQueueObject);
};

module.exports = class RunPromiseRoutineInQueue {
  constructor(aFunctionForCommand) {
    this.functionForCommand = aFunctionForCommand;
    this.isQueueHandled = false;
    this.promisesQueue = [];
  }

  run(aFuncPayload) {
    const runningPromise = new Promise((resolve, reject) => {
      this.promisesQueue.unshift({
        payload: aFuncPayload,
        resolve,
        reject,
      });
    });
    startHandlingQueue(this);
    return runningPromise;
  }
};
