/**
 * console definition.
 */
var console = exports.globals.console = (function() {

  var Console = createObject({ _times: {} });

  mixin(Console, {
    log: function(x, title) {
      var args = slice(arguments, 1);
      var len = args.length;
      var data;

      if (len > 1 && x.split(/%[%sdj]/).length - 1 === len) {
        data = format.apply(null, [x].concat(args));
      } else {
        if (x == null || x === Object(x)) {
          data = inspect(x).replace(/[\\]{2}/g, '\\').replace(/[\x20]*([}\]])\s*$/, '$1');
        } else {
          data = x;
        }

        if (title != null) {
          data = title + '\n' + data;
        }
      }

      data = data + '\n';

      //XXX: async
      WSHModule._postCommand('consolelog', {
        data: data
      });
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
        //TODO: format message (actual value == expect value)
        throw new Error(expression);
      }
    }
  });

  //XXX: todo
  Console.info = Console.warn = Console.error =
  Console.dir = Console.trace = Console.log;

  return Console;
}());

exports.console = console;

