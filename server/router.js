const express = require('express');
const users = require('../routes/users');
const relay = require('../routes/relay');

const router = express.Router();

router.use('/users', users);
router.use('/toggleSwitch', relay);

module.exports = router;
