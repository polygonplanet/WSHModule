/**
 * Clipboard utility.
 */
var Clipboard = (function() {

  var Clipboard = createObject({
    _originalClip: null
  });

  mixin(Clipboard, {
    formats: ['text', 'html'].reduce(function(o, format) {
      o[format] = true;
      return o;
    }, {}),
    hasFormat: function(format) {
      return hasOwn(this.formats, ('' + format).toLowerCase());
    },
    get: function(format) {
      format = ('' + (format || 'text')).toLowerCase();

      if (this.hasFormat(format)) {
        return JSON.parse(WSHModule._postCommand('get' + format + 'clip', {
          read: true
        })).result;
      }
    },
    set: function(data, format) {
      if (!data) {
        return this.empty();
      }
      format = ('' + (format || 'text')).toLowerCase();

      if (this.hasFormat(format)) {
        return WSHModule._postCommand('set' + format + 'clip', {
          data: data
        });
      }
    },
    empty: function() {
      return WSHModule._postCommand('emptyclip');
    }
  });

  ['Text', 'HTML'].forEach(function(format) {
    Clipboard['getAs' + format] = function() {
      return this.get.call(this, format);
    };
    Clipboard['setAs' + format] = function(data) {
      return this.set.call(this, data, format);
    };
  });

  return Clipboard;
}());


[['copy', '^c', 20], ['paste', '^v', 200], ['cut', '^x', 20]].forEach(function(item) {
  var name = item[0];
  var key  = item[1];
  var time = item[2];

  Clipboard[name] = function() {
    sleep(time);
    sendKeys(key);
    return this;
  };
});


Clipboard.withClipboard = function(fn) {
  var args = slice(arguments, 1);
  var data;

  if (this._originalClip === null) {
    data = this._originalClip = this.get();
  } else {
    data = this.get();
  }

  if (data) {
    this.empty();
  }
  return fn.apply(this, args);
};


Clipboard.getSelectedText = function() {
  return this.withClipboard(function() {
    this.copy();
    wait();
    return this.get();
  });
};


Clipboard.print = function(text) {
  return this.withClipboard(function() {
    if (text) {
      this.set(text);
      wait();
      this.paste();
    }
    return this;
  });
};


exports.clip = Clipboard;


