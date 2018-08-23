const express = require('express');
const router = require('./router');
const errorHandler = require('../routes/handlers/errorHandler');
const notFoundHandler = require('../routes/handlers/notFoundHandler');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');

const app = express();

// Add middleware
app.use(bodyParser.json());
app.use(helmet());
app.use(cors());

app.use('/', router);

app.get('*', notFoundHandler);

app.use(errorHandler);

module.exports = app;
