const config = require('config');
// const moment = require('moment');
const app = require('./app');
const db = require('../lib/db');
const logger = require('../lib/logger');

const scheduleManager = require('../lib/scheduleManager');
const gongsManager = require('../lib/gongsManager');
const relayAndSoundManager = require('../lib/relayAndSoundManager');

const PORT = process.env.PORT || config.get('server.port');

app.listen(PORT, () => {
  logger.log('info', `Server listening on port ${PORT}!`);
  logger.log('info', 'Press CTRL-C to stop\n');
});

db.connection.on('error', (err) => {
  logger.log('error', `connection error:${err}`);
});

scheduleManager.start();
scheduleManager.setExecutor(relayAndSoundManager.playGongForJob);

gongsManager.addOnGongActionListener(scheduleManager.jobActionFunction.bind(scheduleManager));
gongsManager.init();

// const time = new Date().getTime() + 60000;
// scheduleManager.addJob({
//   time,
//   data: { stam: 1 },
// });

// const aaaa = scheduleManager.getNextScheduledJob();
// if (aaaa) {
//   console.log('11111', moment(aaaa.time).format('YY-MM-DD HH:mm:ss'), aaaa);
// }

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
