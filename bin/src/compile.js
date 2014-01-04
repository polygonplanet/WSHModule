/**
 * WSHModule: compile
 * Compile to a WSHModule script (wshmodule.wsf) from raw sources.
 *
 * usage: dblclick/execute this file
 */
(function(global, exports, require) {

  var OUT_FILE = '../wshmodule.wsf';
  var TEMPLATE = 'template.wsf';
  var CODE_POINT = '[[CODE_POINT]]';

  var FILES = [
    'shim',
    'util',
    'events',
    'env',
    'uri',
    'dom',
    'fs',
    'clip',
    'console',
    'vm',
    'module'
  ];

  var fs = require('fs');
  var minify = require('tokenizer').minify;
  var codes = [];
  var filename;

  while (FILES.length) {
    filename = FILES.shift() + '.js';
    codes.push(fs.readFileSync(filename));
  }

  var code = fs.readFileSync(TEMPLATE).split(CODE_POINT).join(minify(codes.join('\n')));
  codes = null;

  fs.writeFileSync(OUT_FILE, code);
  fs = code = null;

  WScript.Echo('Done.\nCreated: ' + OUT_FILE);
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
    return exports[request];
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


  /**
   * Separates code to characters. that is rough function.
   */
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

  /**
   * Joins tokenized characters to code string.
   */
  var untokenize = (function() {
    var word = /[\s+\/%*=&|^~<>!?:,;@()\\[\].{}'"-]/;
    var sign = /[^+-]/;

    return function(tokens) {
      var r = [];
      var prev, token, space;

      for (var i = 0, len = tokens.length; i < len; prev = tokens[i++]) {
        token = tokens[i];

        if (!prev) {
          r.push(token);
          continue;
        }

        space = (!sign.test(token) && !sign.test(prev)) ||
                (!word.test(prev.slice(-1)) &&
                 !word.test(token.charAt(0))) ? ' ' : '';

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

  return [this, exports, require];
}(this));
