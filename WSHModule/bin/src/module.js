/**
 * Simple Module specification like Node.js modules/CommonJS for WSH.
 * Module based Node.js/module.js
 */
var Module = (function(builtins) {

  var DEFAULT_EXTENSION = 'js';
  var MODULE_PATH = URI.normalize(WSHModule.scriptDir + [
    '',
    '..',
    'modules'
  ].join(URI.sep));

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
    if (URI.normalize(path) === path) {
      return path;
    }

    var base = null;

    if (inSandbox && !/^[.]+[\/\\]/.test(path)) {
      base = MODULE_PATH;
    }

    return URI.normalize(path, base);
  };


  var resolveExtension = function(path) {
    var ext = URI.extname(path).toLowerCase();

    if (ext in Module.extensions) {
      return path;
    }

    ext = ext || DEFAULT_EXTENSION;
    return path.replace(new RegExp('(?:[.]' + ext + '|)$', 'i'), '.' + ext);
  };


  var Module = mixin(createConstructor(function() {
    this.exports = {};
    this.filename = null;
    this.loaded = false;
  }, {
    load: function(filename) {
      this.filename = filename;
      var extension = URI.extname(filename).toLowerCase();

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
      filename = resolvePath(filename || this.filename || WSHModule._filename);
      var dirname = URI.dirname(filename);

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

      var module = new Module(filename);
      Module.cache[filename] = module;

      var hadException = true;
      try {
        module.load(filename);
        hadException = false;
      } catch (e) {
        var builtinExports = Module._builtins[path];
        if (builtinExports) {
          return builtinExports;
        }
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
}(WSHModule._exportModules()));

