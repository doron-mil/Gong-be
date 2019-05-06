const { exec } = require('child_process');
const os = require('os');
const logger = require('../lib/logger');
const ExecError = require('../model/execError');

/**
 JAR

 The command to be run to access the relay.

 The first part runs java expecting a jar. (assumes java location)
 The second part is the name of the jar. (assumes the name of the jar)

 note: ./ assumes that the jar is in the same directory as the node app

 -- reference is in ---
 http://denkovi.com/denkovi-relay-command-line-tool
 // The second part can be rewritten to be passed as a parameter
 */
let JAVA = '/usr/bin/java -jar ';
if (os.platform() === 'win32') {
  JAVA = '"C:\\Program Files (x86)\\Common Files\\Oracle\\Java\\javapath\\java" -jar ';
}
const JAR = './lib/denkovi/DenkoviRelayCommandLineTool_27.jar ';
const FTDI_ID_NO_SPACE = 'DAE002N9';
const FTDI_ID = `${FTDI_ID_NO_SPACE} `;
const NO_OF_PORTS = 4;
const RELAY_NO_DEVICE = JAVA + JAR;
const RELAY = RELAY_NO_DEVICE + FTDI_ID;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';


class RunCommandInQueue {
  constructor() {
    this.isQueueHandled = false;
    this.promiseQueue = [];
  }

  startHandlingQueue() {
    if (this.isQueueHandled) {
      return;
    }

    this.isQueueHandled = true;

    this.handleQueue();
  }

  handleQueue() {
    if (this.promiseQueue.length <= 0) {
      this.isQueueHandled = false;
      return;
    }

    const { command, resolve, reject } = this.promiseQueue.pop();

    this.runCommand(command, resolve, reject);
  }

  runCommand(aCommand, aResolve, aReject) {
    exec(aCommand, (error, stdout, stderr) => {
      if (error !== null) {
        aReject(new ExecError(error, stderr));
        this.handleQueue();
      } else {
        aResolve(stdout);
        this.handleQueue();
      }
    });
  }

  run(aCommand, aWithDevice = true) {
    const runningPromise = new Promise((resolve, reject) => {
      this.promiseQueue.unshift({
        command: `${aWithDevice ? RELAY : RELAY_NO_DEVICE}${aCommand}`,
        resolve,
        reject,
      });
    });
    this.startHandlingQueue();
    return runningPromise;
  }
}

const commandQueue = new RunCommandInQueue();

/**
 * @param {number[]} aRelayPortsArray
 * @return {string}
 */
const convertPortsArrayToBinNumber = (aRelayPortsArray) => {
  const binArray = new Array(NO_OF_PORTS).fill('0');
  aRelayPortsArray.forEach((portNumber) => {
    if (portNumber > 0 && portNumber <= NO_OF_PORTS) {
      binArray[portNumber - 1] = '1';
    }
  });
  return binArray.join('');
};

let deviceLastConnectionStatus = true;

const computeDeviceConnected = (aDeviceListString) => {
  deviceLastConnectionStatus = aDeviceListString.includes(FTDI_ID_NO_SPACE);
};

const checkDeviceConnected = () => {
  const promiseResult = new Promise((resolve) => {
    const commandPromiseResult = commandQueue.run('list', false);
    commandPromiseResult.then(/** @param {string} listCommandResult */(listCommandResult) => {
      computeDeviceConnected(listCommandResult);
      resolve(deviceLastConnectionStatus);
    }).catch((error) => {
      logger.relayAndSoundManager.error('RelaysModule::checkDeviceConnected ERROR', error);
      resolve(false);
    });
  });

  return promiseResult;
};
/**
 *
 * @param aCommandToRun
 * @param aWithDevice
 * @param aIsFirstCall
 * @return {Promise}
 */
const runCommandInQueue = (aCommandToRun, aWithDevice = true, aIsFirstCall = true) => {
  const errorPrefix = 'RelaysModule::checkDeviceConnected ';
  let deviceIsReadyPromise = Promise.resolve(true);
  if (!deviceLastConnectionStatus) {
    deviceIsReadyPromise = checkDeviceConnected();
  }
  const promiseResult = new Promise((resolve, reject) => {
    deviceIsReadyPromise.then((isDeviceREady) => {
      if (isDeviceREady && aIsFirstCall) {
        commandQueue.run(aCommandToRun, aWithDevice)
          .then((resolveResult) => {
            resolve(resolveResult);
          })
          .catch((error) => {
            logger.relayAndSoundManager.error(`${errorPrefix} ERROR`, error);
            deviceLastConnectionStatus = false;
            runCommandInQueue(aCommandToRun, aWithDevice, false)
              .then((resolveResult) => resolve(resolveResult))
              .catch((errorResult) => reject(errorResult));
          });
      } else if (!IS_PRODUCTION) {
        logger.relayAndSoundManager.info(`${errorPrefix} Device Not ready - Dev Mode`);
        resolve(false);
      } else {
        reject(new Error('Device Not connected'));
      }
    });
  });
  return promiseResult;
};


class RelaysModule {

  constructor() {
    const promiseRes = runCommandInQueue('list', false);
    promiseRes.then((result) => {
      computeDeviceConnected(result);
      const divider = '--------------------------------------------------------------------';
      logger.relayAndSoundManager.info(
        `FTDI List output :\n${divider}\n${result}${divider}`,
      );
    });
  }

  getRelayStatus(aRelayPortNo) {
    const getStatusCommand = `${NO_OF_PORTS} ${aRelayPortNo} status`;
    const returnedStatus = runCommandInQueue(getStatusCommand);
    return returnedStatus;
  }

  toggleRelay(aRelayPortNo) {
    const currentStatus = this.getRelayStatus(aRelayPortNo);
    currentStatus.then((retData) => {
      const newCurrentStatus = !retData || retData.indexOf('0') >= 0 ? 1 : 0;
      const setStatusCommand = `${NO_OF_PORTS} ${aRelayPortNo} ${newCurrentStatus}`;
      return runCommandInQueue(setStatusCommand);
    }).catch((error) => console.error(error));
  }

  setRelayPort(aRelayPortNo, aIsOn) {
    const newCurrentStatus = aIsOn ? 1 : 0;
    const setStatusCommand = `${NO_OF_PORTS} ${aRelayPortNo} ${newCurrentStatus}`;
    return runCommandInQueue(setStatusCommand);
  }

  /**
   * @param {number[]} aRelayPortsNumbersArray
   * @returns {Promise|Promise<any>}
   */
  turnRelayPortsOn(aRelayPortsNumbersArray) {
    if (!aRelayPortsNumbersArray || !Array.isArray(aRelayPortsNumbersArray)
      || aRelayPortsNumbersArray.length > NO_OF_PORTS || aRelayPortsNumbersArray.includes(0)) {
      return this.setRelayPorstAll(true);
    }
    const relayPortsToTurnBinNumber = convertPortsArrayToBinNumber(aRelayPortsNumbersArray);
    const setStatusCommand = `${NO_OF_PORTS} turn ${relayPortsToTurnBinNumber}`;
    return runCommandInQueue(setStatusCommand);
  }

  /**
   * @param {boolean} aIsOn
   * @returns {Promise|Promise<any>}
   */
  setRelayPorstAll(aIsOn = true) {
    const newCurrentStatus = aIsOn ? 1 : 0;
    const setRellayCommand = `${NO_OF_PORTS} all ${newCurrentStatus}`;
    const run = runCommandInQueue(setRellayCommand);
    return run;
  }
}

module.exports = new RelaysModule();
