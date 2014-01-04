/**
 * Script environment utility.
 */
var Env = new (extend(Events, {
  init: function() {
    this.setScriptTimeout(this.getScriptTimeout());
    this.SCRIPT_START_TIME = Date.now();
    this.trigger('start-script');
  },

  CURRENT_PATH: CURRENT_PATH,
  CURRENT_DIR: CURRENT_DIR,
  DIR_SEPARATOR: DIR_SEPARATOR,
  EXTERNAL_CONSOLE_PATH: EXTERNAL_CONSOLE_PATH,

  WAIT_INTERVAL: 30,
  ACTIVE_INTERVAL: 5000,
  MAX_SCRIPT_TIMEOUT: 300 * 1000,
  SCRIPT_START_TIME: -1,

  _timeout: 120,
  isTimeOver: function() {
    return Date.now() - this.SCRIPT_START_TIME > this.getScriptTimeout() * 1000;
  },
  getScriptTimeout: function() {
    return this._timeout;
  },
  setScriptTimeout: function(seconds) {
    this._timeout = seconds;
    try {
      // Timeout should not rely when WScript.Interactive is unknown
      WScript.Timeout = seconds;
    } catch (e) {}
  },
  addScriptTimeout: function(seconds) {
    return this.setScriptTimeout(this.getScriptTimeout() + seconds);
  },
  waitProcess: function(cond) {
    while (!this.isTimeOver() && cond()) {
      sleep(this.WAIT_INTERVAL);
    }
  },
  // Activate alert/popup window by waiting exits process.
  waitActiveProcess: function() {
    sleep(this.ACTIVE_INTERVAL);
  },
  terminate: function() {
    var err;
    try {
      this.trigger('terminate-script');
      this.clear();
      gc();
      this.waitActiveProcess();
    } catch (e) {
      err = e;
    } finally {
      err && WScript.Echo('Error: ' + (err.message || err.description));
      WScript.Quit();
    }
  }
}));

exports.env = Env;

