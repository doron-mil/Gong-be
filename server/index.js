const config = require('config');
const app = require('./app');
const db = require('../lib/db');
const logger = require('../lib/logger');

const PORT = config.get('server.port');

app.listen(PORT, () => {
  logger.log('info', `Server listening on port ${PORT}!`);
  logger.log('info', 'Press CTRL-C to stop\n');
});

db.connection.on('error', (err) => {
  logger.log('error', `connection error:${err}`);
});

// db.connection.once('open', () => {
//   app.listen(PORT, (err) => {
//     if (err) {
//       logger.log('error', `Error starting server: ${err}`);
//       return;
//     }
//     logger.log('info', `server listening on ${PORT}`);
//   });
// });
