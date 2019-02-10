module.exports = class Gong {
  constructor(aType, aAreas = [0], aVolume = 100) {
    this.volume = aVolume;
    this.areas = aAreas;
    this.gongType = aType;
  }
};
