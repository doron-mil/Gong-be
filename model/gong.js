module.exports = class Gong {
  constructor(aType, aAreas = [0], aVolume = 100, aRepeat = 1) {
    this.volume = aVolume;
    this.areas = aAreas;
    this.gongType = aType;
    this.repeat = aRepeat;
  }
};
