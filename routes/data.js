const express = require('express');
const dataHandlers = require('../handlers/data/dataHandlers');

const router = express.Router();

router.get('/areas', dataHandlers.getAreas);

router.get('/gongTypes', dataHandlers.getGongTypes);

router.get('/courses', dataHandlers.getCourses);

router.get('/coursesSchedule', dataHandlers.getCoursesSchedule);

router.get('/course/:id', dataHandlers.getCourseByName);

router.get('/gongs/list', dataHandlers.getManualGongsList);


router.post('/gong/add', dataHandlers.addManualGong);


module.exports = router;
