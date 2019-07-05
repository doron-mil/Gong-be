const { exec } = require('child_process');
const os = require('os');
const logger = require('../lib/logger');
const ExecError = require('../model/execError');
const RunPromiseRoutineInQueue = require('../lib/utils/runPromiseRoutineInQueue');

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

let gDeviceLastConnectionStatus = true;

const computeDeviceConnected = (aDeviceListString) => {
  gDeviceLastConnectionStatus = aDeviceListString.includes(FTDI_ID_NO_SPACE);
};

// eslint-disable-next-line arrow-body-style
const computeCommandToRun = (aCommandToRun, aWithDevice = true) => {
  return `${aWithDevice ? RELAY : RELAY_NO_DEVICE}${aCommandToRun}`;
};

/**
 *
 * @param {RelaysModule} aRelaysModuleObject
 * @return {Promise<any>}
 */
const checkDeviceConnected = (aRelaysModuleObject) => {
  const promiseResult = new Promise((resolve) => {
    const computedCommand = computeCommandToRun('list', false);
    const commandPromiseResult = aRelaysModuleObject.runPromisesInQueue.run(computedCommand);
    commandPromiseResult.then(/** @param {string} listCommandResult */(listCommandResult) => {
      computeDeviceConnected(listCommandResult);
      resolve(gDeviceLastConnectionStatus);
    }).catch((error) => {
      logger.relayAndSoundManager.error('RelaysModule::checkDeviceConnected ERROR', error);
      resolve(false);
    });
  });

  return promiseResult;
};


/**
 *
 * @param {RelaysModule} aRelaysModuleObject
 * @param aCommandToRun
 * @param aWithDevice
 * @param aIsFirstCall
 * @return {Promise<any>}
 */
const runCommandInQueue = (aRelaysModuleObject, aCommandToRun, aWithDevice = true, aIsFirstCall = true) => {
  const errorPrefix = 'RelaysModule::runCommandInQueue ';
  let deviceIsReadyPromise = Promise.resolve(true);
  if (!gDeviceLastConnectionStatus) {
    deviceIsReadyPromise = checkDeviceConnected(aRelaysModuleObject);
  }
  const promiseResult = new Promise((resolve, reject) => {
    deviceIsReadyPromise.then((isDeviceREady) => {
      if (isDeviceREady && aIsFirstCall) {
        const computedCommand = computeCommandToRun(aCommandToRun, aWithDevice);
        aRelaysModuleObject.runPromisesInQueue.run(computedCommand)
          .then((resolveResult) => {
            resolve(resolveResult);
          })
          .catch((error) => {
            logger.relayAndSoundManager.error(`${errorPrefix} ERROR`, error);
            gDeviceLastConnectionStatus = false;
            runCommandInQueue(aRelaysModuleObject, aCommandToRun, aWithDevice, false)
              .then((resolveResult) => resolve(resolveResult))
              .catch((errorResult) => reject(errorResult));
          });
      } else {
        logger.relayAndSoundManager.info(`${errorPrefix} Device Not ready - Dev Mode`);
        resolve(false);
      }
    });
  });
  return promiseResult;
};

const functionToRunCommands = (aPayload) => {
  return new Promise((resolve, reject) => {
    exec(aPayload, (error, stdout, stderr) => {
      if (error !== null) {
        reject(new ExecError(error, stderr));
      } else {
        resolve(stdout);
      }
    });
  });
};

class RelaysModule {
  constructor() {
    this.runPromisesInQueue = new RunPromiseRoutineInQueue(functionToRunCommands);
    const promiseRes = runCommandInQueue(this, 'list', false);
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
    const returnedStatus = runCommandInQueue(this, getStatusCommand);
    return returnedStatus;
  }

  toggleRelay(aRelayPortNo) {
    const currentStatus = this.getRelayStatus(aRelayPortNo);
    currentStatus.then((retData) => {
      const newCurrentStatus = !retData || retData.indexOf('0') >= 0 ? 1 : 0;
      const setStatusCommand = `${NO_OF_PORTS} ${aRelayPortNo} ${newCurrentStatus}`;
      return runCommandInQueue(this, setStatusCommand);
    }).catch((error) => console.error(error));
  }

  setRelayPort(aRelayPortNo, aIsOn) {
    const newCurrentStatus = aIsOn ? 1 : 0;
    const setStatusCommand = `${NO_OF_PORTS} ${aRelayPortNo} ${newCurrentStatus}`;
    return runCommandInQueue(this, setStatusCommand);
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
    return runCommandInQueue(this, setStatusCommand);
  }

  /**
   * @param {boolean} aIsOn
   * @returns {Promise|Promise<any>}
   */
  setRelayPortsAll(aIsOn = true) {
    const newCurrentStatus = aIsOn ? 1 : 0;
    const setRellayCommand = `${NO_OF_PORTS} all ${newCurrentStatus}`;
    const run = runCommandInQueue(this, setRellayCommand);
    return run;
  }
}

module.exports = new RelaysModule();
