/**
 * Script environment utility.
 */
var Env = new (extend(Events, {
  _waitInterval: 30,
  _activeInterval: 5000,
  _maxScriptTimeout: 300 * 1000,
  _scriptStartTime: -1,
  _timeout: 120,

  init: function() {
    this.on('load-uri', function() {
      // handle a script drag-and-drop
      if (WSHModule._filename &&
          URI.normalize(WSHModule._filename) === WSHModule._filename) {
        this.cwd(URI.dirname(WSHModule._filename));
      }
    }.bind(this));

    this.setScriptTimeout(this.getScriptTimeout());
    this._scriptStartTime = Date.now();
    this.trigger('start-script');
  },
  cwd: function(dir) {
    return withShell(function() {
      if (dir) {
        this.CurrentDirectory = dir;
      }
      return '' + this.CurrentDirectory;
    });
  },
  tmpdir: function() {
    if (WSHModule._debug) {
      return WSHModule.scriptDir;
    }

    return withFileSystemObject(function() {
      return ('' + this.GetSpecialFolder(2)).replace(/[\/\\]+$/, '');
    });
  },
  isTimeOver: function() {
    return Date.now() - this._scriptStartTime > this.getScriptTimeout() * 1000;
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
      sleep(this._waitInterval);
    }
  },
  // Activate alert/popup window by waiting exits process.
  waitActiveProcess: function() {
    sleep(this._activeInterval);
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
      err && WSHModule.error(err);
      WScript.Quit();
    }
  }
}));

exports.env = Env;

