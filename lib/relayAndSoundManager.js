const moment = require('moment');

const dateFormat = 'YY-MM-DD HH:mm:ss';

class RelayAndSoundManager {
  constructor() {
  }

  playGong(/* Job */gongToPlay, aFireDate) {
    console.log('RelayAndSoundManager - playGong :\t',
      gongToPlay.data, '\n\t\t\tset time :', moment(aFireDate).format(dateFormat),
      ' current time :', moment().format(dateFormat));
  }
}

module.exports = new RelayAndSoundManager();
