const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const router = require('./router');
const errorHandler = require('../routes/handlers/errorHandler');
// const notFoundHandler = require('../routes/handlers/notFoundHandler');

const app = express();

// Add middleware
app.use(bodyParser.json());
app.use(helmet());
app.use(cors());

app.use(express.static(path.join(__dirname, '../public')));
app.use('/api', router);
app.use('/', router);

app.get('*', (req, res) => {
  res.sendfile('../public/index.html');
  // load the single view file (angular will handle the page changes on the front-end)
});

// app.get('*', notFoundHandler);

app.use(errorHandler);

module.exports = app;
