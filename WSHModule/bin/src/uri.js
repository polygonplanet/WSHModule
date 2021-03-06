/**
 * URI/Path utility
 */
var URI = createObject({
  parse: (function() {
    var capture = (
      'href/+protocol/scheme/-/+-/+userinfo/username/password' +
      '/+-/+-/+-/+network/+-/+host/hostname/port/+pathname' +
      '/dirname/-/filename/extension/+search/query/+hash/fragment'
    ).split('/');

    // RFC 3986 URI Generic Syntax
    // Parsing a URI Reference with a Regular Expression
    var pattern = new RegExp(
      '^' +
      '(?:' +
        '(' + // (1) protocol
          '([^:/\\\\?#.]+)' + // (2) scheme
          '(:+)' + // (3) -
        '|)' +
        '(//|)' + // (4) -
      ')' +
      '(?:' +
        '(' + // (5) userinfo
          '([^/\\\\?#:]*):' + // (6) username
          '([^/\\\\?#]*)' + // (7) password
        '|)' +
        '(@)' + // (8) -
      '|)' +
      '(?:' +
        '(/|)' + // (9) -
        '([\\\\]{2})' + // (10) -
        '([^/\\\\?#]+)' + // (11) network
      '|' +
        '([/\\\\])' + // (12) -
      '|' +
        '(' + // (13) host
          '([-\\w\\u0100-\\uFFFF.%]*)' + // (14) hostname
          '(?:' +
            ':([0-9]+)' + // (15) port
          '|)' +
          '(?=/|$)' +
        '|)' +
      ')' +
      '(' + // (16) pathname
        '(?:' +
          '([^?#]*)' + // (17) dirname
          '([/\\\\])' + // (18) -
        '|)' +
        '(' + // (19) filename
          '[^/\\\\?#]*?' +
          '(?:' +
            '[.]' +
            '([^.?#]*)' + // (20) extension
          '|)' +
        '|)' +
      '|' +
        '[^?#]+' +
      '|)' +
        '(' + // (21) search
          '[?]' +
          '([^#]*)' + // (22) query
        '|)' +
        '(' + // (23) hash
          '#(.*)' + // (24) fragment
        '|)' +
      '$'
    );

    var build = function() {
      var r = [];
      for (var i = 1, len = this.length; i < len; i++) {
        if (i in this) {
          r.push(this[i]);
        } else if (i in this.separators) {
          r.push(this.separators[i]);
        }
      }
      return r.join('');
    };

    return function(uri) {
      pattern.lastIndex = 0;

      var items = uri.match(pattern) || [];
      var result = {};
      var separators = [];

      for (var i = 0, len = items.length; i < len; i++) {
        var item = items[i] || '';
        var names = capture[i].split('+');
        var canPush = !names[0];
        var name = names[canPush ? 1 : 0];

        if (name === '-') {
          canPush && (separators[i] = item);
        } else {
          canPush && (result[i] = item);
          result[name] = item;
        }
      }

      return mixin(result, {
        length: len,
        separators: separators,
        build: build
      });
    };
  }()),

  normalize: function(uri, base) {
    var cur = '' + (base || Env.cwd());
    var path = uri && (uri.href || uri.path) || uri;

    if (!path) {
      return cur;
    }

    var specs = URI.parse(path);
    var isLocal = !specs.scheme || specs.scheme.toLowerCase() === 'file' ||
                   (/^[A-Za-z]:/.test(specs.protocol) && !specs.host);

    var sep = (isLocal || !specs.scheme || ~path.indexOf('\\')) ? '\\' : '/';
    var pos = path.indexOf(sep);

    if (pos === 0) {
      cur = cur.replace(/^(\w+:(?:[\\]|[\/]*[^\/]*[\/])).*$/, '$1');
    }

    var reProtocol = /^([a-zA-Z]\w*:(?:\/+|[\\](?![\\])))/;
    var m = path.match(reProtocol);
    var protocol = m && m[1] || '';

    if (specs.network) {
      cur = sep + sep + specs.network + sep;
      path = path.substring(cur.length);
    } else if (!reProtocol.test(path)) {
      path = cur + sep + path;
    }

    path = path.substring(protocol.length);

    var parts = path.split(/[\/\\]/);
    var len = parts.length;
    var subs = [];

    while (--len >= 0) {
      var part = parts.shift();

      if (!part || part.indexOf('.') === 0) {
        if (part === '..') {
          subs.pop();
        }
        continue;
      }
      subs.push(part);
    }

    if (!isLocal && specs.hostname) {
      protocol += specs.hostname + sep;
    } else if (specs.network) {
      protocol = protocol + cur;
    }

    var absPath = protocol + subs.join(sep);

    if (!specs.network && !reProtocol.test(absPath)) {
      absPath = sep + absPath;
    }
    return absPath;
  },
  extname: function(uri) {
    return URI.parse(uri).extension;
  },
  dirname: function(uri) {
    var parts = URI.parse(uri);
    var dirname = parts.dirname;

    if (!dirname) {
      return '.';
    }

    var protocol = parts.protocol;
    if (/^[a-z]:/i.test(protocol)) {
      var sep = parts.separators.join('').charAt(0);
      return protocol + sep + dirname;
    }
    return dirname;
  },
  sep: WSHModule.sep,
  delimiter: ';'
});

exports.uri = URI;

Env.trigger('load-uri');

