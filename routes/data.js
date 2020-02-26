const express = require('express');

const responder = require('../lib/responder');
const dataHandlers = require('../handlers/data/dataHandlers');

const router = express.Router();

router.get('/staticData', dataHandlers.getStaticData);

router.get('/coursesSchedule', dataHandlers.getCoursesSchedule);

router.get('/course/:id', dataHandlers.getCourseByName);

router.get('/gongs/list', dataHandlers.getManualGongsList);

router.get('/users/list', dataHandlers.getUsersList);


router.post('/gong/add', dataHandlers.addManualGong);

router.post('/gong/toggle', dataHandlers.toggleGong);

router.post('/gong/remove', dataHandlers.removeGong);

router.post('/coursesSchedule/add', dataHandlers.scheduleCourse);

router.post('/uploadCourses', dataHandlers.uploadCourses);

router.post('/uploadGong', dataHandlers.uploadGong);

router.post('/languagesUpdate', dataHandlers.languagesUpdate);

router.post('/user/add', dataHandlers.addUser);

router.post('/user/remove', dataHandlers.removeUser);


router.delete('/coursesSchedule/remove', dataHandlers.removeScheduledCourse);

router.use((req, res) => {
  responder.sendErrorResponse(res, 404, 'Request is not mapped for this server ', null);
});

module.exports = router;
