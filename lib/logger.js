const winston = require('winston');

const tsFormat = () => (new Date()).toLocaleTimeString();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new (winston.transports.Console)({
      timestamp: tsFormat,
      colorize: true,
    }),

  ]
});

module.exports = logger;
