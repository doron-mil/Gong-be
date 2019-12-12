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

app.use(express.static(path.join(__dirname, '../dist')));
app.use('/api', router);
app.use('/mainPage', express.static(path.join(__dirname, '../dist')));
app.use('/loginPage', express.static(path.join(__dirname, '../dist')));
app.use('/', router);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/'));
});

// app.get('*', notFoundHandler);

app.use(errorHandler);

module.exports = app;
