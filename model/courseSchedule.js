module.exports = class CourseSchedule {
  constructor() {
    this.id = undefined;
    this.course_name = undefined;
    this.date = undefined;
    this.startFromDay = undefined;
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
    return newCourseSchedule;
  }
};
