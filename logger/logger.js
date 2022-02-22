const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
require('winston-mongodb')

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rv6z4.mongodb.net/bulkSMS?retryWrites=true&w=majority`;

let transport_array = []

if(process.env.LOGGER_CONSOLE==true){
  const trans_con = new transports.Console()
  transport_array.push(trans_con)
}

if(process.env.LOGGER_FILE==true){
  const trans_file = new transports.File({ filename: 'logFile.log'})
  transport_array.push(trans_file)
}

if(process.env.LOGGER_DB==true){
  const trans_db = new transports.MongoDB({
    db: uri,
   //level: 'error',
    collection: 'error-log',
    options: {
      useUnifiedTopology: true
    }
})
transport_array.push(trans_db)
}

const myFormat = printf(({ level, message, timestamp }) => {
  return `{ ${timestamp} | ${level} : ${message} }`; // stack || message
});


const logger = createLogger({
  format: combine(
    // format.colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // format.errors({ stack: true}),
    myFormat
  ),
  transports: transport_array
});

module.exports = logger
