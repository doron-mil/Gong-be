const path = require('path');
const player = require('play-sound')({});

const logger = require('../lib/logger');
const RunPromiseRoutineInQueue = require('./utils/runPromiseRoutineInQueue');
const utilsManager = require('./utilsManager');
const relaysModule = require('../relay');

const soundPath = path.resolve(__dirname, '../assets/sounds');
/**
 *
 * @param {module.Gong} aGongToPlay
 * @return {Promise<any>}
 */
const playSoundGong = (aGongToPlay) => {
  let { volume } = aGongToPlay;
  volume = (Number.isNaN(Number(volume)) || volume < 1 || volume > 100) ? 100 : volume;

  const options = {
    mplayer: [`-volume ${volume}`],
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

/**
 *
 * @param {module.Gong} aGongToPlay
 */
const orchestrateGong = async (aGongToPlay) => {
  try {
    await turnRelayPortsOn(aGongToPlay, true);
    await playSoundGong(aGongToPlay);
    await turnRelayPortsOff();
    return true;
  } catch (error) {
    logger.relayAndSoundManager.error(
      'RelayAndSoundManager::orchestrateGong ERROR',
      {
        gong: aGongToPlay,
        error,
      },
    );
    return false;
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
    this.runPromisesInQueue.run(aGongToPlay)
      .then(() => {
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
