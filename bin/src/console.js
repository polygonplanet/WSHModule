/**
 * console definition.
 */
var console = exports.globals.console = (function() {

  var CONSOLE_TMPFILE = format('%s%s__WSHModule_ConsoleTmp_%s_%s.txt',
    WSHM_DIR,
    DIR_SEP,
    formatDate('YYYYMMDDHHmmss'),
    Math.random().toString(36).slice(2)
  );


  var Console = createObject({ _time: {} });

  mixin(Console, {
    log: function(x, title) {
      var args = slice(arguments, 1);
      var len = args.length;
      var fs = require('fs');
      var data;

      if (len > 1 && x.split(/%[%sdj]/).length - 1 === len) {
        data = format.apply(null, [x].concat(args));
      } else {
        data = inspect(x);
        if (title != null) {
          data = title + '\n' + data;
        }
        data = data.replace(/[\\]{2}/g, '\\').replace(/[\x20]*([}\]])\s*$/, '$1');
      }

      data = data + '\n';

      //XXX: async
      fs.writeFileSync(CONSOLE_TMPFILE, data);
      execCommand(format('%s /consolelog %s',
        escapeShellArg(EXTERNAL_CONSOLE_PATH),
        escapeShellArg(CONSOLE_TMPFILE)
      ));
      wait();
      fs.unlinkSync(CONSOLE_TMPFILE);
    },
    time: function(label) {
      this._times[label] = Date.now();
    },
    timeEnd: function(label) {
      var time = this._times[label];
      if (!time) {
        throw new Error('No such label: ' + label);
      }
      var duration = Date.now() - time;
      this.log('%s: %dms', label, duration);
    },
    assert: function(expression) {
      if (!expression) {
        //XXX: format
        return false;
      }
    }
  });

  //XXX: todo
  Console.info = Console.warn = Console.error =
  Console.dir = Console.trace = Console.log;

  return Console;
}());

exports.console = console;

