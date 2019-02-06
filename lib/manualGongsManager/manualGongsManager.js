const fs = require('fs');
const ManualGong = require('../../model/manualGong');

module.exports = class ManualGongsManager {

  constructor() {
    this.manualGongArray = [];
    this.retrieveManualGongs();
  }

  addManualGong(jsonManualGong) {
    const newManualGong = new ManualGong();

    newManualGong.date = jsonManualGong.date;
    newManualGong.isActive = jsonManualGong.isActive;
    newManualGong.gong.areas = jsonManualGong.areas;
    newManualGong.gong.gongType = jsonManualGong.gongType;
    newManualGong.gong.volume = jsonManualGong.volume;

    this.manualGongArray.push(newManualGong);
    this.manualGongArray.sort((a, b) => a.time - b.time);
    return this.persistManualGongArray();
  }

  retrieveManualGongs() {
    const rawData = fs.readFileSync('assets/data/manualGong.json');
    this.manualGongArray = JSON.parse(rawData);
  }

  persistManualGongArray() {
    const jsonData = JSON.stringify(this.manualGongArray);
    return new Promise(function (resolve, reject) {
      fs.writeFile('assets/data/manualGong.json', jsonData, (err) => {
        if (err) {
          reject(err);
        }
        resolve(true);
      });
    });
  }
};
