const express = require('express');

const router = express.Router();
const users = require('../routes/users');
const relay = require('../routes/relay');
const data = require('../routes/data');
const rootDataHandlers = require('../handlers/root/rootHandlers');

const authorizeFunc = require('../auth/authorize');


router.use(authorizeFunc());
router.use('/users', users);
router.use('/relay', relay);
router.use('/data', data);

router.post('/login', rootDataHandlers.authenticate);
router.get('/nextgong', rootDataHandlers.getNextGong);

module.exports = router;
