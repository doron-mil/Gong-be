const express = require('express');
const users = require('../routes/users');
const relay = require('../routes/relay');

const router = express.Router();

router.use('/users', users);
router.use('/relay', relay);

module.exports = router;
