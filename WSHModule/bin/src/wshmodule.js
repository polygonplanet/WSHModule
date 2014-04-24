/**
 * WSHModule: Internal module object
 */
var WSHModule = (function(WSHModule) {

  var sep = WSHModule.sep = '\\';

  var scriptFullName = WSHModule.scriptFullName =
    ('' + WScript.ScriptFullName).replace(/^file:\/+/i, '');

  var scriptDir = WSHModule.scriptDir =
    scriptFullName.substring(0, scriptFullName.lastIndexOf(sep));

  var appFullName = WSHModule.appFullName = scriptDir + sep + 'WSHModule.exe';
  var shellFullName = WSHModule.shellFullName = scriptDir + sep + 'wshmshell.js';


  [['_id', null],
   ['_appHandle', null],
   ['_engine', 'wscript']].forEach(function(item) {
    if (!(item[0] in WSHModule)) {
      WSHModule[item[0]] = item[1];
    }
  });

  return createObject(mixin(WSHModule, {
    _debug: true,
    _commandSignature: 262,
    _symbol: {},

    alert: function(msg) {
      WScript.Echo('' + msg);
    },
    error: function(err) {
      //FIXME: WSH/JScript can not get linenumber
      this.alert('Error: ' + (err && (err.message || err.description) || err));
    },
    exit: function(msg) {
      if (arguments.length) {
        this.alert(msg);
      }

      if (typeof Env !== 'undefined') {
        Env.terminate();
      } else {
        WScript.Quit();
      }
    },
    _getTmpfile: function(command) {
      if (!this._id) {
        return this.exit('Invalid id: ' + this._id);
      }

      return format('%s%s__WSHModule_%s_%s.json',
        Env.tmpdir(),
        sep,
        this._id,
        command
      );
    },
    _postCommand: function(command, options) {
      if (!this._appHandle) {
        return this.exit('Invalid handle: ' + this._appHandle);
      }

      command = command.toLowerCase().replace(/\W+/g, '');
      options || (options = {});

      var fs = require('fs');
      var tmpfile = this._getTmpfile(command);
      var tpl = '%s %s';
      var args = [this.appFullName, tmpfile];
      var cmd = format.apply(null, [tpl].concat(args.map(escapeShellArg)));

      fs.writeFileSync(tmpfile, JSON.stringify({
        command: command,
        signature: this._commandSignature,
        handle: this._appHandle,
        data: options.data
      }));

      var winStyle = options.winStyle == null ? 4 : options.winStyle;

      var res = this._symbol;
      try {
        res = execCommand(cmd, winStyle, options.async);

        while (res === this._symbol) {
          wait();
        }

        if (options.read) {
          res = fs.readFileSync(tmpfile);
        } else {
          res = void 0;
        }
      } finally {
        fs.unlinkSync(tmpfile);
      }
      return res;
    },
    _setup: function() {
      if (!this._filename) {
        var argc = WScript.Arguments.Count();
        if (argc < 4) {
          this.error('too few arguments to application');
          return this.exit();
        }

        var str = function(s) { return '' + s; };
        var num = function(n) { return n - 0; };
        var engine = function(e) {
          return e === 'cscript' ? e : 'wscript';
        };

        [['_filename', str],
         ['_id', str],
         ['_appHandle', num],
         ['_engine', engine]].forEach(function(item, i) {
          this[item[0]] = item[1](WScript.Arguments.Item(i));
        }, this);
      }

      Env.trigger('setup-wshmodule');
      return this._exportModules();
    },
    load: function() {
      this._setup();

      if (/^[\/-]shell$/i.test(this._filename)) {
        return this.runShell();
      }
      return Module._load(this._filename);
    },
    runShell: function() {
      this._filename = this.shellFullName;
      return Module._load(this._filename);
    },
    runScript: function(code) {
      //TODO: remove global
      //delete global.WSHModule;

      this._setup();

      if (this._inSandbox && !this._termRegistered) {
        Env.on('terminate-script', function() {
          try {
            // Remove a temporary sandbox file
            require('fs').unlinkSync(this.scriptFullName);
          } catch (e) {}
        }.bind(this));

        // Send a temporary filename to application
        // for abnormal termination and completing clean ups.
        this._postCommand('tmpfile', {
          data: this.scriptFullName
        });

        this._termRegistered = true;
      }

      return new Module()._compile(code, this._filename, {
        terminate: true
      });
    },
    _exportModules: function() {
      var globals = this.exports.globals;
      if (!globals) {
        return;
      }

      Object.keys(globals).forEach(function(key) {
        global[key] = globals[key];
      });

      delete this.exports.globals;
      return this.exports;
    }
  }));

}(global.WSHModule));

