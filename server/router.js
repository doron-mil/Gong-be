const express = require('express');
const users = require('../routes/users');
const relay = require('../routes/relay');
const data = require('../routes/data');
const authenticateFunc = require('../auth/authenticate');
const authorizeFunc = require('../auth/authorize');

const router = express.Router();

router.use(authorizeFunc());
router.use('/users', users);
router.use('/relay', relay);
router.use('/data', data);

router.post('/login', async (req, res, next) => {
  const token = await authenticateFunc({
    username: req.body.username,
    password: req.body.password,
  });
  if (token) {
    res.json({ token });
  } else {
    res.status(400)
      .json({ message: 'Username or password is incorrect' });
  }
});

module.exports = router;
