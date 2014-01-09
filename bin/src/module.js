/**
 * Simple Module specification like Node.js modules/CommonJS for WSH.
 * Module based Node.js/module.js
 */
var Module = (function(builtins) {

  var DEFAULT_EXTENSION = 'js';
  var MODULE_PATH = URI.normalize(CURRENT_DIR + [
    '',
    '..',
    'modules',
    'dummy.js'
  ].join(DIR_SEPARATOR));

  var inSandbox = !!WSHModule._inSandbox;


  var clean = function(src) {
    // Remove BOM
    if (src.charCodeAt(0) === 0xFEFF) {
      src = src.slice(1);
    }
    return src.replace(/^#.*$/m, '');
  };


  var getRequire = function(self) {
    return mixin(function(path) {
      return self.require(path);
    }, {
      cache: Module.cache,
      _builtins: Module._builtins,
      extensions: Module.extensions
    });
  };


  var resolvePath = function(path) {
    return URI.normalize(path, inSandbox ? MODULE_PATH : CURRENT_PATH);
  };


  var resolveExtension = function(path) {
    var ext = DEFAULT_EXTENSION;
    return path.replace(new RegExp('(?:[.]' + ext + '|)$', 'i'), '.' + ext);
  };


  var Module = mixin(createConstructor(function() {
    this.exports = {};
    this.filename = null;
    this.loaded = false;
  }, {
    load: function(filename) {
      this.filename = filename;
      var extension = URI.getExt(filename).toLowerCase();

      if (!Module.extensions[extension]) {
        extension = DEFAULT_EXTENSION;
      }
      Module.extensions[extension](this, filename);
      this.loaded = true;
    },
    require: function(path) {
      return Module._load(path);
    },
    _compile: function(source, filename, options) {
      var vm = require('vm');
      var context = vm.createContext({
        require: getRequire(this),
        exports: this.exports,
        module: this
      });
      context.global = context;
      source = clean(source);

      options = options || {};
      filename = URI.normalize(filename || this.filename || WSHModule._filename);
      var dirname = URI.normalize(URI.parse(filename).dirname);

      mixin(context, {
        __filename: filename,
        __dirname: dirname
      });

      if (inSandbox || options.terminate) {
        return vm.runInContext(source, context, options);
      }

      return vm.runInNewContext(source, context, {
        filename: filename
      });
    }
  }), {
    cache: {},
    _builtins: builtins,
    extensions: {
      js: function(module, filename) {
        var content = require('fs').readFileSync(filename);
        module._compile(content, filename);
      },
      json: function(module, filename) {
        var content = require('fs').readFileSync(filename);
        try {
          module.exports = JSON.parse(clean(content));
        } catch (e) {
          e.message = filename + ': ' + (e.message || e.description);
          throw e;
        }
      }
    },
    _load: function(path) {
      var filename = resolvePath(resolveExtension(path));

      var cachedModule = Module.cache[filename];
      if (cachedModule) {
        return cachedModule.exports;
      }

      var builtinExports = Module._builtins[path];
      if (builtinExports) {
        return builtinExports;
      }

      var module = new Module(filename);
      Module.cache[filename] = module;

      var hadException = true;
      try {
        module.load(filename);
        hadException = false;
      } catch (e) {
        throw e;
      } finally {
        if (hadException) {
          delete Module.cache[filename];
        }
      }
      return module.exports;
    }
  });

  return Module;
}(function(wm) {
  mixin(wm, {
    _setup: function() {
      var argc = wm._argc;
      if (argc > 0) {
        var filename = WScript.Arguments.Item(argc - 1);
        if (argc > 1 && filename === wm._fixed64bitSymbol) {
          filename = WScript.Arguments.Item(argc - 2);
        }
        wm._filename = filename;
      }
      return wm._exportModules();
    },
    load: function() {
      wm._setup();

      return Module._load(wm._filename);
    },
    runScript: function(code) {
      wm._setup();

      if (wm._inSandbox && !wm._termRegistered) {
        Env.on('terminate-script', function() {
          try {
            // Remove a temporary sandbox file.
            require('fs').unlinkSync(CURRENT_PATH);
          } catch (e) {}
        });
        wm._termRegistered = true;
      }

      return new Module()._compile(code, wm._filename, {
        terminate: true
      });
    },
    _exportModules: function() {
      var globals = wm.exports.globals;
      if (!globals) {
        return;
      }

      Object.keys(globals).forEach(function(key) {
        global[key] = globals[key];
      });

      delete wm.exports.globals;
      return wm.exports;
    }
  });

  return (global.WSHModule = createObject(wm))._exportModules();
}(WSHModule)));

