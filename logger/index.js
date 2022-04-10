const socialLogger = require('./logger');

let logger;
if (process.env.NODE_ENV !== 'production') {
    logger = socialLogger('debug');
  }else{
    logger = socialLogger(process.env.LOG_LEVEL);
  }
module.exports = logger;