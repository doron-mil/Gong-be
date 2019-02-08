const fs = require('fs');
const ManualGong = require('../../model/manualGong');

module.exports = class ManualGongsManager {

  constructor() {
    this.manualGongArray = [];
    this.retrieveManualGongs();
  }

  getManualGongsList() {
    return this.manualGongArray;
  }

  addManualGong(jsonManualGong) {
    const newManualGong = new ManualGong();

    newManualGong.date = jsonManualGong.date;
    newManualGong.isActive = jsonManualGong.isActive;
    newManualGong.gong.areas = jsonManualGong.gong.areas;
    newManualGong.gong.gongType = jsonManualGong.gong.gongType;
    newManualGong.gong.volume = jsonManualGong.gong.volume;

    this.manualGongArray.push(newManualGong);
    this.manualGongArray.sort((a, b) => a.date - b.date);
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
