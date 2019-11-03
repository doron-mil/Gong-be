const ftdi = require('FT245RL');
const logger = require('../lib/logger');
const RunPromiseRoutineInQueue = require('../lib/utils/runPromiseRoutineInQueue');

const NO_OF_PORTS = process.env.NO_OF_PORTS ? Number.parseInt(process.env.NO_OF_PORTS,10) : 4;

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


const setOnDeviceListeners = (aDevice) => {
  aDevice.on('error', (error) => {
    logger.relayAndSoundManager.error('DEVICE EMITTER : ON ERROR !!!', { error });
  });
  aDevice.on('open', () => {
    logger.relayAndSoundManager.info('DEVICE EMITTER : ON OPEN !!!');
  });
  aDevice.on('data', (data) => {
    logger.relayAndSoundManager.info(`DEVICE EMITTER : ON DATA !!! data = ${data}`);
  });
  aDevice.on('close', () => {
    logger.relayAndSoundManager.info('DEVICE EMITTER : ON CLOSE !!!');
  });
  console.log('GO DEVICE !!!', aDevice);
};

/**
 *
 * @param {RelaysModule} aRelaysModuleObject
 * @return {Promise<any>}
 */
const findDevice = (aRelaysModuleObject) => {
  const retDevicePromise = new Promise((resolve, reject) => {
    ftdi.findFirst().then((device) => {
      const { description, serialNumber, vendorId, productId } = device.deviceSettings;
      const foundPref = '################## Found Device';
      logger.relayAndSoundManager
        .info(`${foundPref} : ${serialNumber} ${description} vendorId :${vendorId} productId: ${productId}`);
      setOnDeviceListeners(device);
      aRelaysModuleObject.setFtdiDevice(device);
      resolve(device);
    }).catch((err) => {
      aRelaysModuleObject.setFtdiDevice(null);
      reject(err);
    });
  });
  return retDevicePromise;
};

/**
 *
 * @param {RelaysModule} aRelaysModuleObject
 * @param aCommandToRun
 * @param aWithDevice
 * @param aIsFirstCall
 * @return {Promise<any>}
 */
const runCommandInQueue = (aRelaysModuleObject, aCommandToRun) => {
  const errorPrefix = 'RelaysModule::runCommandInQueue ';
  let deviceIsReadyPromise = Promise.resolve(true);
  if (!aRelaysModuleObject.FtdiDevice) {
    deviceIsReadyPromise = findDevice(aRelaysModuleObject);
  }
  const promiseResult = new Promise((resolve, reject) => {
    deviceIsReadyPromise.then(() => {
      aRelaysModuleObject.runPromisesInQueue.run(aCommandToRun)
        .then((resolveResult) => {
          resolve(resolveResult);
        })
        .catch((error) => {
          logger.relayAndSoundManager.error(`${errorPrefix} Error in executing command (${aCommandToRun})`, { error });
          reject(error);
        });
    }).catch((error) => {
      logger.relayAndSoundManager.error(`${errorPrefix} Couldn't execute command (${aCommandToRun})`, { error });
      resolve(false);
    });
  });
  return promiseResult;
};


const callBetweenOpenAndClose = (aRelaysModuleObject, aCallBackFunc) => {
  const retPromise = new Promise((resolve, reject) => {
    ftdi.openDevice(aRelaysModuleObject.FtdiDevice).then(() => {
      let error;
      aCallBackFunc()
        .catch((err) => {
          error = err;
          logger.relayAndSoundManager.error('Failed to activate action on device', { error: err });
        })
        .finally(() => {
          ftdi.closeDevice(aRelaysModuleObject.FtdiDevice).then(() => {
            if (error) {
              reject(error);
            } else {
              resolve(true);
            }
          }).catch((err) => {
            logger.relayAndSoundManager.error('Failed to close device', { error: err });
            reject(err);
          });
        });
    }).catch((error) => {
      logger.relayAndSoundManager.error('Failed to open device', { error });
      reject(error);
    });
  });
  return retPromise;
};

/**
 *
 * @param {RelaysModule} aRelaysModuleObject
 * @return
 */
const functionToRunCommands = (aRelaysModuleObject) => {
  const errorPrefix = 'RelaysModule::functionToRunCommands ';
  return (aPayload) => {
    return new Promise((resolve, reject) => {
      const tokensArray = aPayload.split(' ');
      if (!tokensArray || tokensArray.length < 2 || (tokensArray[1] !== 'find' && tokensArray.length < 3)) {
        reject(new Error(`${errorPrefix}. Invalid command : ${aPayload}`));
        return;
      }
      if ((tokensArray[1] !== 'find' && !aRelaysModuleObject.FtdiDevice)) {
        reject(new Error(`${errorPrefix}. FTDI device not set. Command : ${aPayload}`));
        return;
      }

      let isOn;
      let portOnArray;
      switch (tokensArray[1]) {
        case 'find':
          ftdi.findFirst().then((device) => {
            resolve(device);
          })
            .catch((err => reject(err)));
          break;
        case 'all':
          isOn = tokensArray[2] === '1';
          callBetweenOpenAndClose(aRelaysModuleObject,
            () => ftdi.switchAllPorts(aRelaysModuleObject.FtdiDevice, isOn))
            .then(() => resolve(true))
            .catch((err) => reject(err));
          break;
        case 'turn':
          portOnArray = Array.from(tokensArray[2]).map((x => Number.parseInt(x, 10)));
          callBetweenOpenAndClose(aRelaysModuleObject,
            () => ftdi.switchPorts(aRelaysModuleObject.FtdiDevice, portOnArray))
            .then(() => resolve(true))
            .catch((err) => reject(err));
          break;
        default:
          reject(new Error(`${errorPrefix}. Could not interpret payload : ${aPayload}`));
          break;
      }
    }); // Of ret Promise
  };
};


class RelaysModule {
  constructor() {
    const errorPrefix = 'RelaysModule::constructor';
    this.FtdiDevice = null;
    this.runPromisesInQueue = new RunPromiseRoutineInQueue(functionToRunCommands(this));

    findDevice(this).then(() => {
      logger.relayAndSoundManager.info(`${errorPrefix} Managed to get handle to device`);

    }).catch((error) => {
      logger.relayAndSoundManager.error(`${errorPrefix} Couldn't connect to device`, { error });
    });
  }

  setFtdiDevice(value) {
    this.FtdiDevice = value;
  }

  /**
   * @param {number[]} aRelayPortsNumbersArray
   * @returns {Promise|Promise<any>}
   */
  turnRelayPortsOn(aRelayPortsNumbersArray) {
    if (!aRelayPortsNumbersArray || !Array.isArray(aRelayPortsNumbersArray)
      || aRelayPortsNumbersArray.some(value => (value < 0 || value > NO_OF_PORTS))) {
      const newError = new Error(`RelaysModule::turnRelayPortsOn Invalid input array : ${aRelayPortsNumbersArray}`);
      return Promise.reject(newError);
    }
    if (aRelayPortsNumbersArray.includes(0)) {
      return this.setRelayPortsAll(true);
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
    const setRelayCommand = `${NO_OF_PORTS} all ${newCurrentStatus}`;
    const run = runCommandInQueue(this, setRelayCommand);
    return run;
  }
}

module.exports = new RelaysModule();
