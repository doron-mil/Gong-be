const express = require('express');
const users = require('../routes/users');
const relay = require('../routes/relay');
const data = require('../routes/data');

const router = express.Router();

router.use('/users', users);
router.use('/relay', relay);
router.use('/data', data);

module.exports = router;
