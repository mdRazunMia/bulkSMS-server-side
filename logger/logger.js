const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
require('winston-mongodb')
const myFormat = printf(({ level, message, timestamp }) => {
  return `{ ${timestamp} | ${level} : ${message} }`; // stack || message
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rv6z4.mongodb.net/bulkSMS?retryWrites=true&w=majority`;

const logger = createLogger({
  format: combine(
    // format.colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // format.errors({ stack: true}),
    myFormat
  ),
  transports: [
      new transports.Console(),
      new transports.File({ filename: 'logFile.log'}),
      new transports.MongoDB({
          db: uri,
        //   level: 'error',
          collection: 'error-log',
          options: {
              useUnifiedTopology: true
          }
      })
  ]
});

module.exports = logger
