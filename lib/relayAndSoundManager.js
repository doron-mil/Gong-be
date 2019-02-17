const moment = require('moment');

const dateFormat = 'YY-MM-DD HH:mm:ss';

class RelayAndSoundManager {
  constructor() {
  }

  playGong(/* Job */aGongToPlayJob, aFireDate) {
    console.log('RelayAndSoundManager - playGong :\t',
      aGongToPlayJob.data, '\n\t\t\tset time :', moment(aFireDate).format(dateFormat),
      ' current time :', moment().format(dateFormat));
    return true;
  }
}

module.exports = new RelayAndSoundManager();
