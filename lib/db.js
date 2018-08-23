const mongoose = require('mongoose');
const config = require('config');
const logger = require('./logger');

const HOST = config.get('db.host');
const PORT = config.get('db.port');

const url = `mongodb://${HOST}:${PORT}`;

mongoose.Promise = global.Promise;

mongoose.connect(url, () => logger.log('info', 'connected to mongo'));

module.exports = {
  connection: mongoose.connection,
};
