const express = require('express');
const usersHandlers = require('./handlers/usersHandlers');

const router = express.Router();

router.get('/', usersHandlers.getUsers);

router.get('/:id', usersHandlers.getUsersId);

module.exports = router;
