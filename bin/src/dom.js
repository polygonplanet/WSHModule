/**
 * Define basic DOM functions that can be fetched from 'htmlfile'.
 */
var DOM = (function(DOM) {

  DOM.createHTML = function(content) {
    var args = slice(arguments, 1);
    var document = WScript.GetObject(CURRENT_PATH, 'htmlfile');

    if (content == null) {
      content = [
        '<!doctype html>',
        '<html>',
        '<head>',
        '<title>\u6587\u5b57\u30b3\u30fc\u30c9\u266b</title>', /* dummy for unicode */
        '<meta charset="utf-8">',
        '<meta http-equiv=content-type content="text/html; charset=utf-8">',
        '<style>body{margin:0;padding:0}</style>',
        '<script type="text/javascript" charset="utf-8">',
        '(function(){',
        '[[0]]',
        '}());',
        '<' + ['/script>'],
        '[[1]]',
        '</head>',
        '<body>',
        '\u6587\u5b57\u30b3\u30fc\u30c9\u266b',
        '[[2]]',
        '</body>',
        '</html>'
      ].join('\n');
    }
    if (args.length) {
      for (var i = 0, len = args.length; i < len; i++) {
        content = content.split('[[' + i + ']]').join(args[i]);
      }
    }
    document.open();
    document.write(content);
    document.close();

    Env.waitProcess(function() {
      return document.readyState != 'complete';
    });

    var window = document.parentWindow;
    window.ActiveXObject = ActiveXObject;

    return {
      window: window,
      document: document
    };
  };


  DOM._contexts = [];

  DOM.createContext = function() {
    var context = DOM.createHTML.apply(null, arguments);
    DOM._contexts.push(context);
    return context;
  };


  DOM.clearContexts = function() {
    for (var i = DOM._contexts.length - 1; i >= 0; --i) {
      try {
        DOM._contexts[i] = null, delete DOM._contexts[i];
      } catch (e) {}
    }
    DOM._contexts.length = 0;
  };


  DOM._globalContext = DOM.createContext();
  DOM.window = DOM._globalContext.window;
  DOM.document = DOM._globalContext.document;

  DOM.location = new String(CURRENT_PATH);
  DOM.location.href = '' + DOM.location;

  (function(paths) {
    mixin(DOM.location, {
      hash: paths.hash,
      host: paths.host,
      hostname: paths.hostname,
      pathname: paths.pathname,
      port: paths.port,
      protocol: paths.protocol,
      search: paths.search,
      href: paths.href
    });
  }(URI.parse(DOM.location.href)));


  // alert/confirm/prompt
  // WSH function definition does not work in the object.
  // define variables in global.
  alert = exports.globals.alert = function(msg) {
    WScript.Echo('' + msg);
  };


  var SYMBOL = {};

  confirm = exports.globals.confirm = function(msg) {
    var res = SYMBOL;

    res = DOM.window.confirm(msg);
    Env.waitProcess(function() {
      return res === SYMBOL;
    });
    return !!res;
  };


  prompt = exports.globals.prompt = function(title, defaultValue) {
    try {
      var script = new ActiveXObject('ScriptControl');
      script.Language = 'VBScript';
      script.allowUI = true;

      var code = format([
        'Function VBPrompt',
        'VBPrompt = InputBox(unescape("%s"), , unescape("%s"))',
        'End Function'
      ].join('\n'), escape(title || ' '), escape(defaultValue || ''));

      script.AddCode(code);

      var result = script.Run('VBPrompt');
      script = null;
      return result == null ? null : '' + result;
    } catch (e) {
      e.message = "Windows 64bit can't use ScriptControl in System32: " + (e.message || e.description);
      throw e;
    }
  };


  // set/clearTimeout
  var timers = DOM.timers = {
    ids: {},
    length: 0
  };

  setTimeout = exports.globals.setTimeout = function(func, delay) {
    var args = slice(arguments, 2);

    Env.addScriptTimeout(delay + Env.ACTIVE_INTERVAL);
    var id = DOM.window.setTimeout(function() {
      delete timers.ids[id], timers.length--, func.apply(func, args);
    }, delay);

    return timers.length++, timers.ids[id] = id;
  };


  clearTimeout = exports.globals.clearTimeout = function(id) {
    if (id in timers.ids) {
      delete timers.ids[id], timers.length--;
    }
    return DOM.window.clearTimeout(id);
  };


  // set/clearInterval
  var intervals = DOM.intervals = {
    ids: {},
    length: 0
  };


  setInterval = exports.globals.setInterval = function(func, interval) {
    var args = slice(arguments, 2);

    Env.addScriptTimeout(interval);
    var id = DOM.window.setInterval(function() {
      Env.addScriptTimeout(interval + Env.ACTIVE_INTERVAL), func.apply(func, args);
    }, interval);

    return intervals.length++, intervals.ids[id] = id;
  };


  clearInterval = exports.globals.clearInterval = function(id) {
    if (id in intervals.ids) {
      delete intervals.ids[id], intervals.length--;
    }
    return DOM.window.clearInterval(id);
  };


  // Wait process when timers running
  Env.on('terminate-script', function() {
    this.waitProcess(function() {
      return timers.length > 0 || intervals.length > 0;
    });

    var id;
    for (id in timers.ids) {
      DOM.window.clearTimeout(id);
    }
    for (id in intervals.ids) {
      DOM.window.clearInterval(id);
    }
  });

  // Builtin XMLHttpRequest can't load local file.
  // Overwrite builtin XMLHttpRequest
  XMLHttpRequest = exports.globals.XMLHttpRequest = function() {
    return new ActiveXObject('Microsoft.XMLHTTP');
  };

  return DOM;
}({}));

