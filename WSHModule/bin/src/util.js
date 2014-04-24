/**
 * WSHModule: Utilities
 */
exports.util = {};

var slice = Array.prototype.slice.call.bind(Array.prototype.slice);
var hasOwn = Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);
var toString = Object.prototype.toString.call.bind(Object.prototype.toString);


var mixin = exports.util.mixin = function(target) {
  slice(arguments, 1).forEach(function(source) {
    var key, keys = Object.keys(source);
    for (var i = 0, len = keys.length; i < len; i++) {
      key = keys[i], target[key] = source[key];
    }
  });
  return target;
};


var createConstructor = exports.util.createConstructor = function(Ctor, proto) {
  if (!proto) {
    proto = Ctor, Ctor = function(){};
  }

  Ctor = (function(Ctor_) {
    return function() {
      var args = slice(arguments);
      if (this instanceof Ctor) {
        Ctor_.apply(this, args);
        this.init && this.init.apply(this, args);
        return this;
      }
      return new (Ctor.bind.apply(Ctor, [null].concat(args)));
    };
  }(Ctor || function(){}));

  return (Ctor.prototype = (proto || (proto = {}))).constructor = Ctor;
};


var createObject = exports.util.createObject = function() {
  return new (createConstructor.apply(null, arguments));
};


var extend = exports.util.extend = function() {
  var inherits = function(childFn, parentFn) {
    return function() {
      return childFn.apply(this, arguments), parentFn.apply(this, arguments);
    };
  };

  var child = {};
  var type;

  slice(arguments).forEach(function(parent) {
    type || (type = typeof parent);

    var keys = Object.keys(parent);
    var Ctor = parent.constructor;

    for (var i = 0, len = keys.length; i < len; i++) {
      var key = keys[i];
      var val = parent[key];

      // ignore constructor property
      if (Ctor && val === Ctor) {
        continue;
      }

      if (typeof val === 'function' && hasOwn(child, key) &&
          typeof child[key] === 'function') {
        val = inherits(child[key], val);
      }
      child[key] = val;
    }

    if (type === 'function') {
      child = extend(parent.prototype, child);
    }
  });

  return type === 'function' ? createConstructor(child) : child;
};


// format from node.js/lib/util
var format = exports.util.format = function(f) {
  var args = arguments;
  var len = args.length;
  var i = 1;

  return String(f).replace(/%[sdj%]/g, function(x) {
    if (x === '%%') {
      return '%';
    }

    if (i >= len) {
      return x;
    }

    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
};


var formatDate = exports.util.formatDate = function(template, timestamp) {
  var specs = 'YYYY:MM:DD:HH:mm:ss'.split(':');
  var date = new Date(timestamp || Date.now() - new Date().getTimezoneOffset() * 60000);
  return date.toISOString().split(/[-:.TZ]/).reduce(function(template, item, i) {
    return template.split(specs[i]).join(item);
  }, template);
};


var sleep = exports.util.sleep = function(msec) {
  return WScript.Sleep(msec), msec;
};

// internal only usage
var wait = function(msec) {
  return sleep(msec || Env._waitInterval);
};


var bindAll = function(target) {
  return Object.keys(target).forEach(function(key) {
    if (typeof this[key] === 'function') {
      this[key] = this[key].bind(this);
    }
  }, target), target;
};


var gc;
(function(CollectGarbage_) {
  gc = exports.util.gc = function() {
    try {
      CollectGarbage_ && CollectGarbage_();
    } catch (e) {}
  };
}(typeof CollectGarbage !== 'undefined' ? CollectGarbage : null));


var Shell, withShell;
var FileSystemObject, withFileSystemObject;
var Stream, withStream;

(function() {
  var factory_WshObject = function(prog) {
    var name = prog.split('.').pop();
    var withName = 'with' + name;

    var create = function() {
      return new ActiveXObject(prog);
    };

    var withInstance = function(func) {
      var result;
      var instance;
      var index = 1;

      if (arguments.length === 1) {
        instance = create();
      } else {
        instance = func;
        func = arguments[index++];
      }

      var args = slice(arguments, index);

      try {
        result = func.apply(instance, args);
      } finally {
        instance && instance.Close && instance.Close();
        instance = null;
      }
      return result;
    };

    return mixin(create, {
      withInstance: withInstance
    });
  };

  Shell = exports.util.Shell = factory_WshObject('WScript.Shell');
  withShell = exports.util.withShell = Shell.withInstance;

  FileSystemObject = exports.util.FileSystemObject =
    factory_WshObject('Scripting.FileSystemObject');
  withFileSystemObject = exports.util.withFileSystemObject =
    FileSystemObject.withInstance;

  Stream = exports.util.Stream = factory_WshObject('ADODB.Stream');
  withStream = exports.util.withStream = Stream.withInstance;
}());


var escapeSpace = exports.util.escapeSpace = function(string) {
  var esc = /([\x08\x09\x0a-\x0d\x20\x22\x27\x5c\xa0\u2028\u2029\ufeff])/g;
  return string.replace(esc, function(a, c) {
    return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
  });
};


// Escape characters like JSON.stringify
var escapeString = exports.util.escapeString = (function() {
  var meta = {
    '\u0008': '\\b',  // <BS>
    '\u0009': '\\t',  // <HT> <TAB>
    '\u000a': '\\n',  // <LF>
    '\u000c': '\\f',  // <FF>
    '\u000d': '\\r',  // <CR>
    '\u0027': '\\\'',
    '\u0022': '\\"',
    '\u005c': '\\\\',
    '\u002f': '\\/'
  };
  // Older versions of WSH does not recognize Unicode regex \uxxxx.
  var escapable = /[\uffff]/.test('\uffff') ? /[\\\"'\/\x00-\x1f\u007f-\uffff]/g : /[\\\"'\/\x00-\x1f\x7f-\xff]/g;

  return function(string) {
    escapable.lastIndex = 0;
    return escapable.test(string) ? string.replace(escapable, function(a) {
      var c = meta[a];
      return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) : '' + string;
  };
}());


// Escape a string to be used as a shell argument (for Windows CMD)
var escapeShellArg = exports.util.escapeShellArg = function(arg) {
  var es = ['"'];
  var fill = function() {
    for (var j = es.length - 1; j > 0 && es[j] === '\\'; --j) {
      es.push('\\');
    }
  };
  var c;

  for (var i = 0, len = arg.length; i < len; i++) {
    c = arg.charAt(i);
    switch (c) {
      case '%':
          fill();
          es.push('"');
          es.push('%');
          es.push('"');
          break;
      case '"':
          fill();
          es.push('"');
          // fall-through
      default:
          es.push(c);
          break;
    }
  }
  fill();
  es.push('"');
  return es.join('');
};


/*
 * Convert string to the system default text encoding
 * example:
 *   var defaults = require('util').toDefaultEncoding('abc');
 *   // defaults: {
 *   //   value: "\u0061\u0062\u0063", // system defalt encoded string
 *   //   code: [97, 98, 99] // array of character code
 *   // }
 */
var toDefaultEncoding = exports.util.toDefaultEncoding = function(value) {
  return JSON.parse(WSHModule._postCommand('todefaultencoding', {
    read: true,
    data: JSON.stringify({
      value: value
    })
  }));
};


// cf. http://msdn.microsoft.com/ja-jp/library/cc364421.aspx
var execCommand = exports.util.execCommand = function(cmd, winStyle, async) {
  return withShell(function() {
    return this.Run(cmd, winStyle === void 0 ? 4 : (winStyle | 0), !async);
  });
};


// cf. http://msdn.microsoft.com/ja-jp/library/cc364423.aspx
var sendKeys = exports.util.sendKeys = function(keys) {
  var args = slice(arguments);

  withShell(function() {
    for (var i = 0, len = args.length; i < len; i++) {
      var key = args[i];
      wait();
      this.SendKeys(key);
    }
  });
};


// Type detection from Node.js/util
var isArray = exports.util.isArray = function(x) {
  return Array.isArray(x);
};

var isBoolean = exports.util.isBoolean = function(x) {
  return typeof x === 'boolean' || toString(x) === '[object Boolean]';
};

var isNull = exports.util.isNull = function(x) {
  return x === null;
};

var isNullOrUndefined = exports.util.isNullOrUndefined = function(x) {
  return x == null;
};

var isNumber = exports.util.isNumber = function(x) {
  return typeof x === 'number' || toString(x) === '[object Number]';
};

var isString = exports.util.isString = function(x) {
  return typeof x === 'string' || toString(x) === '[object String]';
};

var isUndefined = exports.util.isUndefined = function(x) {
  return x === void 0;
};

var isRegExp = exports.util.isRegExp = function(x) {
  return isObject(x) && toString(x) === '[object RegExp]';
};

var isObject = exports.util.isObject = function(x) {
  return typeof x === 'object' && x !== null;
};

var isDate = exports.util.isDate = function(x) {
  return isObject(x) && toString(x) === '[object Date]';
};

var isError = exports.util.isError = function(x) {
  return isObject(x) && (toString(x) === '[object Error]' || x instanceof Error);
};

var isFunction = exports.util.isFunction = function(x) {
  return typeof x === 'function';
};

var isPrimitive = exports.util.isPrimitive = function(x) {
  return x === null || x === Object(x);
};

// simple implementation from nodejs/inspect
var Inspector = createConstructor({
  init: function() {
    this.depth = 0;
    this.recurseTimes = 0;
  },
  indent: function(n) {
    if (n > 0) {
      this.depth = this.depth + n;
    }
    var i = this.depth + 1;
    var t = i > 0 ? Array(i).join(' ') : '';

    if (n && n < 0) {
      this.depth = Math.max(0, this.depth + n);

      var r = this.recurseTimes - 1;
      if (r > 0) {
        t = t + Array(r).join(' ');
      }
    }
    return t;
  },
  recurse: function(func) {
    if (++this.recurseTimes > 8) {
      this.recurseTimes--;
      return '...';
    }

    try {
      return func.call(this);
    } catch (e) {
      return '[' + e + ']';
    } finally {
      this.recurseTimes = Math.max(0, this.recurseTimes - 1);
    }
  },
  typeOf: function(x) {
    return toString(x).slice(8, -1).toLowerCase();
  },
  keys: function(o) {
    return Object.keys(o);
  },
  formatString: function(s) {
    return ["'", "'"].join(
      JSON.stringify(s).slice(1, -1).replace(/'/g, "\\'").replace(/\\"/g, '"')
    );
  },
  formatArray: function(arr) {
    if (!arr.length) {
      return '[]';
    }

    var self = this;

    return this.recurse(function() {
      return '[\n' + this.indent(1) + arr.reduce(function(a, v, i) {
        try {
          if (v === arr) {
            return a;
          }
          a.push(self.indent() + i + ': ' + self.inspect(v));
        } catch (e) {
          a.push(self.indent() + i + ': [Unknown]');
        }
        return a;
      }, []).join(',\n' + this.indent()) + '\n' + this.indent(-1) + ']';
    });
  },
  formatObject: function(o) {
    if (typeof o !== 'object') {
      return '[Unknown]';
    }

    var keys = this.keys(o);
    if (!keys.length) {
      return '{}';
    }

    var self = this;

    return this.recurse(function() {
      return '{\n' + this.indent(1) + keys.reduce(function(a, k) {
        try {
          if (o[k] === o) {
            return a;
          }
          a.push(self.indent() + k + ': ' + self.inspect(o[k]));
        } catch (e) {
          a.push(self.indent() + k + ': [Unknown]');
        }
        return a;
      }, []).join(',\n' + this.indent()) + '\n' + this.indent(-1) + '}';
    });
  },
  inspect: function(x) {
    if (this.depth > 8) {
      this.depth--;
      return '...';
    }

    if (x === null) {
      return 'null';
    }

    switch (this.typeOf(x)) {
      case 'undefined': return 'undefined';
      case 'function': return '[Function' + (x.name ? ' ' + x.name : '') + ']';
      case 'boolean': return '' + x;
      case 'number': return '' + x;
      case 'string': return this.formatString(x);
      case 'regexp': return ' ' + RegExp.prototype.toString.call(x);
      case 'error': return '[' + Error.prototype.toString.call(x) + ']';
      case 'date': return ' ' + Date.prototype.toUTCString.call(x);
      case 'array': return this.formatArray(x);
      case 'object': default: return this.formatObject(x);
    }
  }
});

var inspect = exports.util.inspect = function(x) {
  return new Inspector().inspect(x);
};

