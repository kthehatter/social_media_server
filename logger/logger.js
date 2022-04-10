const { createLogger, format, transports } = require('winston');
const { combine, timestamp,  printf } = format;

const myFormat = printf(({ level, message,  timestamp }) => {
  return `{'timestamp':'${timestamp}',  'level':'${level}', 'message':'${message}'}`;
});

const socialLogger = (LOG_LEVEL)=>{
return createLogger({
    level: LOG_LEVEL,
    format: combine(
        format.colorize(),
        timestamp(),
        myFormat
      ),
    defaultMeta: { service: 'user-service' },
    transports: [
      //
      // - Write all logs with importance level of `error` or less to `error.log`
      // - Write all logs with importance level of `info` or less to `combined.log`
      //
      new transports.Console(),
      new transports.File({ filename: 'logs/error.log', level: 'error' }),
      new transports.File({ filename: 'logs/combined.log', level: 'debug' }),
    ],
  });
}
module.exports= socialLogger;