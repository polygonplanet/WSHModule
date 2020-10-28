/**
 * WSHModule: compiler
 * Compile WSHModule script (wshmodule.wsf) from raw sources (bin/src/*.js)
 *
 * usage: dblclick/execute this file or `wscript compiler.js`
 */
(function(global, exports, require) {

  var OUT_FILE = '../wshmodule.wsf';
  var TEMPLATE = 'template.wsf';
  var CODE_POINT = '[[CODE_POINT]]';

  var FILES = [
    'shim',
    'util',
    'wshmodule',
    'events',
    'env',
    'uri',
    'dom',
    'fs',
    'clip',
    'console',
    'compiler',
    'vm',
    'module'
  ];

  var fs = require('fs');
  var compile = require('compiler').compile;
  var codes = [];
  var filename;

  while (FILES.length) {
    filename = FILES.shift() + '.js';
    if (filename === 'compiler.js') {
      codes.push(require('compiler_definition'));
    } else {
      codes.push(fs.readFileSync(filename));
    }
  }

  var code = fs.readFileSync(TEMPLATE).split(CODE_POINT).join(compile(codes.join('\n')));
  codes = null;

  fs.writeFileSync(OUT_FILE, code);
  fs = code = null;

  WScript.Echo('Done.\n' + OUT_FILE);
  WScript.Quit();

}).apply(this, function() {
  var exports = {
    fs: {
      readFileSync: function(filename, encoding) {
        encoding || (encoding = 'UTF-8');

        return withStream(function() {
          this.Type = 2;
          this.Charset = encoding;
          this.Open();
          this.LoadFromFile(filename);
          return this.ReadText(-1);
        });
      },
      writeFileSync: function(filename, data, encoding) {
        encoding || (encoding = 'UTF-8');

        var trimBOM = false;
        var skipLen = 0;

        if (/^UTF-?8$/i.test(encoding)) {
          skipLen = 3;
          trimBOM = true;
        } else if (/^UTF-?16$/i.test(encoding)) {
          skipLen = 2;
          trimBOM = true;
        }

        var stream = new Stream();
        stream.Type = 2;
        stream.Charset = encoding;
        stream.Open();
        stream.WriteText(data);

        if (trimBOM) {
          stream.Position = 0;
          stream.Type = 1;
          stream.Position = skipLen;
          var binary = stream.Read();
          stream.Close(), stream = null;

          stream = new Stream();
          stream.Type = 1;
          stream.Open();
          stream.Write(binary);
        }
        stream.SaveToFile(filename, 2);
        stream.Close(), stream = null;
      }
    }
  };

  var require = function(request) {
    return exports[request] ||
      Function(exports.fs.readFileSync(request + '.js')).call(this);
  };

  var Stream = function() {
    return new ActiveXObject('ADODB.Stream');
  };

  var withStream = function(func) {
    var stream = new Stream();
    var result;

    try {
      result = func.call(stream);
    } catch (e) {
      throw e;
    } finally {
      stream && stream.close && stream.close();
      stream = null;
    }
    return result;
  };

  require('shim');

  var compiler_definition = function() {
    var hasOwn = Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);
    var push = Array.prototype.push;

    // Separates code to characters. that is rough function
    var tokenize = (function() {
      var TOKEN = 1,
          REGEX_PREFIX = 2,
          NL = 3,
          REGEX_LITERAL = 4;

      var re = {
        token: new RegExp(
          '(' + '/[*][\\s\\S]*?[*]/' +                  // multiline comment
          '|' + '/{2,}[^\\r\\n]*(?:\\r\\n|\\r|\\n|)' +  // single line comment
          '|' + '"(?:\\\\[\\s\\S]|[^"\\r\\n\\\\])*"' +  // string literal
          '|' + "'(?:\\\\[\\s\\S]|[^'\\r\\n\\\\])*'" +  // string literal
          '|' + '(' + '^' + // (2) regexp literal prefix
                '|' + '[-!%&*+,/:;<=>?[{(^|~]' +
                ')' +
                '(?:' +
                    '(' +  // (3) line break
                      '(?!' + '[\\r\\n])\\s+' +
                        '|' + '(?:\\r\\n|\\r|\\n)' +
                     ')' +
                  '|' + '\\s*' +
                ')' +
                '(?:' +
                  '(' +  // (4) regular expression literal
                      '(?:/(?![*])(?:\\\\.|[^/\\r\\n\\\\])+/)' +
                      '(?:[gimy]{0,4}|\\b)' +
                  ')' +
                  '(?=\\s*' +
                    '(?:' + '(?!\\s*[/\\\\<>*+%`^"\'\\w$-])' +
                            '[^/\\\\<>*+%`^\'"@({[\\w$-]' +
                      '|' + '===?' +
                      '|' + '!==?' +
                      '|' + '[|][|]' +
                      '|' + '[&][&]' +
                      '|' + '/(?:[*]|/)' +
                      '|' + '[,.;:!?)}\\]\\r\\n]' +
                      '|' + '$' +
                    ')' +
                  ')' +
                ')' +
          '|' + '>>>=?|<<=|===|!==|>>=' +               // operators
          '|' + '[+][+](?=[+])|[-][-](?=[-])' +
          '|' + '[=!<>*+/&|^-]=' +
          '|' + '[&][&]|[|][|]|[+][+]|[-][-]|<<|>>' +
          '|' + '0(?:[xX][0-9a-fA-F]+|[0-7]+)' +        // number literal
          '|' + '\\d+(?:[.]\\d+)?(?:[eE][+-]?\\d+)?' +
          '|' + '[1-9]\\d*' +
          '|' + '[-+/%*=&|^~<>!?:,;@()\\\\[\\].{}]' +   // operator
          '|' + '(?:(?![\\r\\n])\\s)+' +                // white space
          '|' + '(?:\\r\\n|\\r|\\n)' +                  // nl
          '|' + '[^\\s+/%*=&|^~<>!?:,;@()\\\\[\\].{}\'"-]+' + // token
          ')',
          'g'
        ),
        nl: /^(?:\r\n|\r|\n)/,
        notSpace: /[\S\r\n]/,
        comments: /^\/{2,}[\s\S]*$|^\/[*][\s\S]*?[*]\/$/
      };

      return function(code) {
        var tokens = [];
        var token, prev, m;

        re.token.lastIndex = 0;
        while ((m = re.token.exec(code)) != null) {
          token = m[TOKEN];

          if (!re.notSpace.test(token) || re.comments.test(token)) {
            continue;
          }

          if (m[REGEX_LITERAL]) {
            if (m[REGEX_PREFIX]) {
              tokens.push(m[REGEX_PREFIX]);
            }

            if (m[NL] && re.notSpace.test(m[NL])) {
              tokens.push(m[NL]);
            }

            tokens.push(m[REGEX_LITERAL]);
          } else {
            prev = tokens[tokens.length - 1];
            if (!prev || !re.nl.test(prev) || !re.nl.test(token)) {
              tokens.push(token);
            }
          }
        }
        return tokens;
      };
    }());

    // Joins tokenized characters to code string
    var untokenize = (function() {
      var notWord = /[\s+\/%*=&|^~<>!?:,;@()\\[\].{}'"-]/;
      var notSign = /[^+-]/;

      return function(tokens) {
        var r = [];
        var prev, token, space;

        for (var i = 0, len = tokens.length; i < len; prev = tokens[i++]) {
          token = tokens[i];

          if (!prev) {
            r.push(token);
            continue;
          }

          space = (!notSign.test(token) && !notSign.test(prev)) ||
                  (!notWord.test(prev.slice(-1)) &&
                   !notWord.test(token.charAt(0))) ? ' ' : '';

          r.push(space + token);
        }
        return r.join('');
      };
    }());

    // simple minifying
    var minify = function(code) {
      return untokenize(tokenize(code));
    };

    exports.tokenizer = {
      tokenize: tokenize,
      untokenize: untokenize,
      minify: minify
    };

    // A tiny code modifier to compatible with the ECMA-262 standard
    var Compiler = function(code) {
      this.code = code;
    };

    Compiler.prototype = {
      compile: function() {
        this.tokens = tokenize(this.code);

        ['keepReservedWords', 'resolveTryFinally'].forEach(function(fn) {
          this[fn]();
        }, this);

        return untokenize(this.tokens);
      },
      eat: function(index, n, step) {
        step = step || 0;

        var ws = /\s/;
        var t;

        do {
          t = this.tokens[index += n];
        } while (ws.test(t) || --step >= 0);

        return t;
      },
      keepReservedWords: function() {
        var reservedWords = [
          'break case catch continue default delete do else finally',
          'for function if in instanceof new return switch this throw',
          'try typeof var void while with',
          'abstract boolean byte char class const debugger double',
          'enum export extends final float goto implements import',
          'int interface long native package private protected public',
          'short static super synchronized throws transient volatile',
          // JScript bug words
          'comment label closure color start'
        ].join(' ').split(/\s+/).reduce(function(words, word) {
          return words[word] = null, words;
        }, {});

        var res = [];
        var tokens = this.tokens;
        var notAlpha = /[^a-z]/;
        var token, prev, next;

        for (var i = 0, len = tokens.length; i < len; i++) {
          token = tokens[i];
          prev = this.eat(i, -1);
          next = this.eat(i, 1);

          if (!notAlpha.test(token) && hasOwn(reservedWords, token)) {
            if (prev === '.') {
              res.pop();
              push.apply(res, [
                '[', "'" + token + "'", ']'
              ]);
              continue;
            }

            // `{ xxx: ... }` or `get xxx() {...}` or `set xxx() {...}`
            if (((prev === ',' || prev === '{') && next === ':') ||
                ((prev === 'get' || prev === 'set') && next === '(' )) {
              token = "'" + token + "'";
            }
          }
          res.push(token);
        }
        this.tokens = res;
      },
      // Fix try-finally statements
      // JScript will not execute finally statement when catch omitted
      //TODO: eval code, Function('...')
      resolveTryFinally: function() {
        var res = [];
        var tokens = this.tokens;
        var depths = [];
        var level = 0;
        var token, prev, next;

        for (var i = 0, len = tokens.length; i < len; i++) {
          token = tokens[i];
          prev = this.eat(i, -1);
          next = this.eat(i, 1);

          switch (token) {
            case '{':
                level++;
                break;
            case '}':
                level--;
                break;
            case 'try':
                if (next === '{') {
                  depths.push(level);
                }
                break;
            case 'catch':
                if (prev === '}' && next === '(' && depths[depths.length - 1] === level) {
                  depths.pop();
                }
                break;
            case 'finally':
                if (depths[depths.length - 1] === level && next === '{' && prev === '}') {
                  push.apply(res, [
                    'catch', '(', '$e', ')', '{', 'throw', ' ', '$e', ';', '}'
                  ]);
                  depths.pop();
                }
                break;
          }
          res.push(token);
        }
        this.tokens = res;
      }
    };

    exports.compiler = {
      compile: function(code) {
        var compiler = new Compiler(code);
        return compiler.compile();
      }
    };
  };

  exports.compiler_definition = (function(definition) {
    definition();
    var code = Function.prototype.toString.call(definition);
    return code.replace(/^[^{]*\{([\s\S]+)\}[^}]*$/, '$1');
  }(compiler_definition));

  return [this, exports, require];
}(this));
