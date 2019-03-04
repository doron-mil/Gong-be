const ExceptionGong = require('./exceptionGong');

module.exports = class CourseSchedule {
  constructor() {
    this.id = undefined;
    this.course_name = undefined;
    this.date = undefined;
    this.startFromDay = undefined;
    this.exceptions = undefined;
  }

  insertException(aNewException) {
    if (!this.exceptions) {
      this.exceptions = [];
    }
    this.exceptions.push(aNewException);
  }

  isExceptionExists(aTimeFromStartStr) {
    let isExist = false;
    if (this.exceptions) {
      isExist = this.exceptions.some((exceptionItem) => exceptionItem.day_time_str === aTimeFromStartStr);
    }
    return isExist;
  }

  removeException(aExceptionToRemove) {
    let removed = false;
    if (this.exceptions) {
      const foundIndex = this.exceptions.findIndex(
        (exceptionGong) => exceptionGong.day_number === aExceptionToRemove.day_number
          && exceptionGong.time === aExceptionToRemove.time);
      if (foundIndex) {
        removed = true;
        this.exceptions.splice(foundIndex, 1);
      }
    }
    return removed;
  }

  static fromJson(aJsonCourseScheduleRecord, aTimeAsId = undefined) {
    const newCourseSchedule = new CourseSchedule();
    if (aJsonCourseScheduleRecord.id) {
      newCourseSchedule.id = aJsonCourseScheduleRecord.id;
    } else if (aTimeAsId) {
      newCourseSchedule.id = aTimeAsId;
    }
    newCourseSchedule.course_name = aJsonCourseScheduleRecord.course_name;
    newCourseSchedule.date = aJsonCourseScheduleRecord.date;
    newCourseSchedule.startFromDay = aJsonCourseScheduleRecord.startFromDay;
    if (aJsonCourseScheduleRecord.exceptions) {
      newCourseSchedule.exceptions = [];
      aJsonCourseScheduleRecord.exceptions.forEach((exceptionJson) => {
        newCourseSchedule.exceptions.push(ExceptionGong.fromJson(exceptionJson));
      });
    }
    return newCourseSchedule;
  }
};
