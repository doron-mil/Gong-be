const path = require('path');
const players = [
  'mplayer',
  'afplay',
  'ffplay',
  'mpg123',
  'mpg321',
  'play',
  'omxplayer',
  'aplay',
  'cmdmp3'
];
const player = require('play-sound')({ players, });

const logger = require('../lib/logger');
const RunPromiseRoutineInQueue = require('./utils/runPromiseRoutineInQueue');
const utilsManager = require('./utilsManager');
const relaysModule = require('../relay');

const soundPath = path.resolve(__dirname, '../assets/sounds');

const isOverrideProduction = false;
const isProduction = process.env.NODE_ENV === 'production' || isOverrideProduction;

/**
 *
 * @param {module.Gong} aGongToPlay
 * @return {Promise<any>}
 */
const playSoundGong = (aGongToPlay) => {
  let { volume, repeat } = aGongToPlay;
  volume = (Number.isNaN(Number(volume)) || volume < 1 || volume > 100) ? 100 : volume;
  repeat = (Number.isNaN(Number(repeat)) || repeat < 1 || repeat > 20) ? 1 : repeat;

  const options = {
    mplayer: [`-volume ${volume}`, `-loop ${repeat}`],
    ffplay: ['-nodisp', '-autoexit', '-loglevel quiet', `-af volume=${volume / 100}`, `-loop ${repeat}`],
    shell: true,
    cwd: soundPath,
  };

  let { gongType } = aGongToPlay;
  gongType = Number.isNaN(Number(gongType)) ? 0 : gongType;
  const whatGongType = utilsManager.gongsMap.get(gongType) || utilsManager.gongsMap.get(0);

  return new Promise((resolve, reject) => {
    player.play(whatGongType.pathName, options, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

/**
 * @param {module.Gong} aGongToPlay
 * @param {boolean} aIsToOpen
 */
const turnRelayPortsOn = (aGongToPlay) => relaysModule.turnRelayPortsOn(aGongToPlay.areas);

const turnRelayPortsOff = () => relaysModule.setRelayPortsAll(false);

const callAsyncThrowIfProd = async (aFunc, ...aParams) => {
  try {
    await aFunc.call(null, ...aParams);
    return true;
  } catch (e) {
    if (isProduction) {
      throw e;
    } else {
      return false;
    }
  }
};

/**
 *
 * @param {module.Gong} aGongToPlay
 */
const orchestrateGong = async (aGongToPlay) => {
  try {
    let relayResult = await callAsyncThrowIfProd(turnRelayPortsOn, aGongToPlay);
    await playSoundGong(aGongToPlay);
    if (relayResult) {
      relayResult = await callAsyncThrowIfProd(turnRelayPortsOff);
    }
    if (!relayResult) {
      throw new Error('Relay was unaccessible. Was detoured because we are in DEV MODE !!!!!'
        + '. Gong is played even though the logger states otherwise');
    }
    return true;
  } catch (error) {
    logger.relayAndSoundManager.error(
      'RelayAndSoundManager::orchestrateGong ERROR',
      {
        gong: aGongToPlay,
        error,
      },
    );
    throw (error);
  }
};

const functionToRunCommands = (aPayload) => {
  return orchestrateGong(aPayload);
};

class RelayAndSoundManager {
  constructor() {
    this.runPromisesInQueue = new RunPromiseRoutineInQueue(functionToRunCommands);
  }

  /**
   *
   * @param {module.Job} aGongToPlayJob
   * @param {Date} aFireDate
   */
  playGongForJob = (aGongToPlayJob, aFireDate) => {
    return this.runPromisesInQueue.run(aGongToPlayJob.data)
      .then(() => {
        logger.relayAndSoundManager.info('RelayAndSoundManager.playGongForJob ',
          {
            job: aGongToPlayJob,
            execTime: aFireDate,
          });
      })
      .catch((error) => {
        logger.relayAndSoundManager.error(
          'RelayAndSoundManager.playGongForJob ERROR',
          {
            job: aGongToPlayJob,
            error,
          },
        );
      });
  };

  /**
   *
   * @param {module.Gong} aGongToPlay
   */
  playImmediateGong = (aGongToPlay) => {
    return this.runPromisesInQueue.run(aGongToPlay)
      .then((aaa) => {
        console.log('----------------', aaa);
        logger.relayAndSoundManager.info('RelayAndSoundManager.playImmediateGong ', { gong: aGongToPlay });
      })
      .catch((error) => {
        logger.relayAndSoundManager.error(
          'RelayAndSoundManager.playImmediateGong ERROR',
          {
            gong: aGongToPlay,
            error,
          },
        );
      });
  };
}

module.exports = new RelayAndSoundManager();
