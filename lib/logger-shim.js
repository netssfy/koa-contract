'use strict';
/**
 * logger adapter
 */

class LoggerShim {
  constructor(loggerImpl) {
    this._impl = loggerImpl;
  }

  info(msg) {
    if (this._impl) this._impl.info(msg);
  }

  warning(msg) {
    if (this._impl) this._impl.warning(msg);
  }

  error(msg) {
    if (this._impl) this._impl.error(msg);
  }

  debug(msg) {
    if (this._impl) this._impl.debug(msg);
  }

  trace(msg) {
    if (this._impl) this._impl.trace(msg);
  }
}

exports = module.exports = LoggerShim;