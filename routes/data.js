const express = require('express');
const dataHandlers = require('../handlers/data/dataHandlers');

const router = express.Router();

router.get('/staticData', dataHandlers.getStaticData);

router.get('/coursesSchedule', dataHandlers.getCoursesSchedule);

router.get('/course/:id', dataHandlers.getCourseByName);

router.get('/gongs/list', dataHandlers.getManualGongsList);


router.post('/gong/add', dataHandlers.addManualGong);

router.post('/gong/toggle', dataHandlers.toggleGong);

router.post('/gong/remove', dataHandlers.removeGong);

router.post('/coursesSchedule/add', dataHandlers.scheduleCourse);

router.post('/uploadCourses', dataHandlers.uploadCourses);

router.post('/languagesUpdate', dataHandlers.languagesUpdate);

router.delete('/coursesSchedule/remove', dataHandlers.removeScheduledCourse);

module.exports = router;
