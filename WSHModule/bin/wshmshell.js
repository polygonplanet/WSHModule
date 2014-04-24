/*
 * WSHModule: shell
 */

if (typeof module === 'undefined' || !module.exports) {
  WScript.Echo('This file needs to be opened with an application.');
  WScript.Quit();
}

(function(/*context, shell*/) {
  try {
    arguments[1].context = arguments[0];
    arguments[1].execute();
  } catch (e) {
    WScript.Echo('Error: ' + (e.message || e.description || e));
  }

}(this, function(global, scope, evalInContext) {

  var env = require('env');
  var util = require('util');

  var stdin = WScript.StdIn;
  var stdout = WScript.StdOut;
  var stderr = WScript.StdErr;

  var _orginal_postCommand = global.WSHModule._postCommand;

  global.WSHModule._postCommand = function(command, options) {
    command = command.toLowerCase().replace(/\W+/g, '');
    options || (options = {});

    switch (command) {
      case 'consolelog':
        stdout.WriteLine(options.data);
        break;
      case 'gettextclip':
      case 'settextclip':
      case 'emptyclip':
      case 'gethtmlclip':
      case 'sethtmlclip':
      case 'tmpfile':
        return _orginal_postCommand.apply(this, arguments);
      // noop dom functions
      case 'alert':
        stdout.WriteLine(options.data);
        break;
      case 'confirm':
        stdout.WriteLine(options.data);
        break;
      case 'prompt':
        stdout.WriteLine(JSON.parse(options.data).defaultValue);
        break;
    }
  };


  var WSHModuleShell = util.createObject({
    _closed: false,
    context: scope,
    result: void 0,
    statement: '',

    read: function(n) {
      return stdin.Read(n);
    },
    readLine: function() {
      return stdin.ReadLine();
    },
    readAll: function() {
      return stdin.ReadAll();
    },
    write: function(s) {
      stdout.Write('' + s);
    },
    writeLine: function(s) {
      stdout.WriteLine('' + s);
    },
    warn: function(err) {
      stderr.WriteLine('' + (err && (err.message || err.description) || err));
    },
    closed: function() {
      return this._closed = stdin.AtEndOfStream;
    },
    close: function() {
      this._closed = true;
      return env.terminate();
    },
    stepStatement: function() {
      this.write('>');

      if (this.closed()) {
        this.readAll();
        return false;
      }

      this.statement = this.readLine();

      try {
        this.result = this.evaluate();
        this.writeLine(this.result);
      } catch (e) {
        this.warn(e);
      } finally {
        this.statement = '';
      }

      return true;
    },
    execute: function() {
      try {
        while (this.stepStatement());
      } catch (e) {
        this.warn(e);
      } finally {
        this.close();
      }
    },
    _filterContext: function() {
      var context = this.context || {};
      var statement = this.statement;

      context._getShellStatement = function() {
        delete context._getShellStatement;
        return statement;
      };
      return context;
    },
    evaluate: function() {
      return evalInContext.call(this);
    }
  });

  return WSHModuleShell;
}((function() { return this; }()) || this || {}, this, function() {
  return (function() {
    with (this) {
      //TODO: variable scope
      return eval(this._getShellStatement());
    }
  }).call(this._filterContext());
})));

