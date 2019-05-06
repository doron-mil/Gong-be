module.exports = class GongType {
  constructor(aId, aName, aPathName) {
    this.id = aId;
    this.name = aName;
    this.pathName = aPathName;
  }

  static fromJson(aJsonGongTypeRecord) {
    const newGongType = new GongType();
    Object.assign(newGongType, aJsonGongTypeRecord);
    return newGongType;
  }
};
