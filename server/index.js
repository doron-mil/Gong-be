const config = require('config');
const app = require('./app');
const db = require('../lib/db');
const logger = require('../lib/logger');
const scheduleManager = require('../lib/scheduleManager');
const manualGongsManager = require('../lib/gongsManager');
const relayAndSoundManager = require('../lib/relayAndSoundManager');

const PORT = config.get('server.port');

app.listen(PORT, () => {
  logger.log('info', `Server listening on port ${PORT}!`);
  logger.log('info', 'Press CTRL-C to stop\n');
});

db.connection.on('error', (err) => {
  logger.log('error', `connection error:${err}`);
});

scheduleManager.start();
scheduleManager.setExecuter(relayAndSoundManager.playGong);
manualGongsManager.addOnAddGongListener(scheduleManager.addJob.bind(scheduleManager));
scheduleManager.addJobsArray(manualGongsManager.getGongsAsJobsArray());

const time = new Date().getTime() + 60000;
scheduleManager.addJob({
  time,
  data: { stam: 1 },
});
// scheduleManager.start();

// db.connection.once('open', () => {
//   app.listen(PORT, (err) => {
//     if (err) {
//       logger.log('error', `Error starting server: ${err}`);
//       return;
//     }
//     logger.log('info', `server listening on ${PORT}`);
//   });
// });
