const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, timestamp }) => {
  return `{${timestamp} ${level} : ${message}}`; // stack || message
});

const logger = createLogger({
  format: combine(
    // format.colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // format.errors({ stack: true}),
    myFormat
  ),
  transports: [
      new transports.Console(),
      new transports.File({ filename: 'logFile.log'})
  ]
});

module.exports = logger