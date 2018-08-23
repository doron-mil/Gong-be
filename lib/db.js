const mongoose = require('mongoose');
const config = require('config');
const logger = require('./logger');

const HOST = config.get('db.host');
const PORT = config.get('db.port');

// const HOST = 'localhost';
// const PORT = 27017;


const url = `mongodb://${HOST}:${PORT}`;
// const url = `mongodb://${HOST}/dddd`;

mongoose.Promise = global.Promise;

mongoose.connect(url, () => logger.log('info', 'connected to mongo')).then( (success) =>{
}).catch( (error) => {
});

module.exports = {
  connection: mongoose.connection,
};
