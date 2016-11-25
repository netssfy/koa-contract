'use strict';
/**
 * logger adapter
 */

class Logger {
  constructor(loggerImpl) {
    this._impl = loggerImpl;
  }

  info(msg) {
    if (this._impl) this._impl.info(msg);
  }
}

var s_logger = null;

exports = module.exports = Logger;