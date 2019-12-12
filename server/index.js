const fs = require('fs');
const { exec } = require('child_process');
const config = require('config');
const http = require('http');
const https = require('https');
const app = require('./app');
// const db = require('../lib/db');
const logger = require('../lib/logger');

const scheduleManager = require('../lib/scheduleManager');
const gongsManager = require('../lib/gongsManager');
const relayAndSoundManager = require('../lib/relayAndSoundManager');

const PORT = config.get('server.port') || 3001;
const USE_HTTPS = !!process.env.HTTPS;

const server = USE_HTTPS ? https.createServer({
  key: fs.readFileSync('certs/server.key'),
  cert: fs.readFileSync('certs/server.pem'),
}, app) : http.createServer(app);

server.listen(PORT, () => {
  exec('whoami', (err, stdout, stderr) => {
    logger.log('info', '\n');
    logger.log('info', `Server listening on port ${PORT} using ${USE_HTTPS ? 'https' : 'http'}`);
    logger.log('info', 'Press CTRL-C to stop');
    if (err !== null) {
      logger.error('Failed to retrieve whoami\n', err);
    } else {
      logger.log('info', `Whomai = ${stdout}\n`);
    }
  });
});

// db.connection.on('error', (err) => {
//   logger.log('error', `connection error:${err}`);
// });

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
