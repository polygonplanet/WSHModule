/**
 * Clipboard utility.
 */
var Clipboard = (function() {

  var CLIP_TMPFILE = format('%s%s__WSHModule_ClipTmp_%s_%s.txt',
    CURRENT_DIR,
    DIR_SEPARATOR,
    formatDate('YYYYMMDDHHmmss'),
    Math.random().toString(36).slice(2)
  );


  var Clipboard = createObject({
    _originalClip: null
  });

  Clipboard.get = function() {
    var fs = require('fs');

    execCommand(format('%s /getclip %s',
      escapeShellArg(EXTERNAL_CONSOLE_PATH),
      escapeShellArg(CLIP_TMPFILE)
    ));
    wait();

    var text = fs.readFileSync(CLIP_TMPFILE);
    fs.unlinkSync(CLIP_TMPFILE);
    return text;
  };

  Clipboard.set = function(text) {
    var fs = require('fs');
    fs.writeFileSync(CLIP_TMPFILE, '' + text);

    execCommand(format('%s /setclip %s',
      escapeShellArg(EXTERNAL_CONSOLE_PATH),
      escapeShellArg(CLIP_TMPFILE)
    ));
    wait();

    fs.unlinkSync(CLIP_TMPFILE);
    return this;
  };

  return Clipboard;
}());


[['copy', '^c', 20], ['paste', '^v', 500], ['cut', '^x', 20]].forEach(function(item) {
  var name = item[0];
  var key  = item[1];
  var time = item[2];

  Clipboard[name] = function() {
    sleep(time);
    sendKeys(key);
    return this;
  };
});


var withClipboard = function(fn) {
  var args = slice(arguments, 1);
  var data;

  if (Clipboard._originalClip === null) {
    data = Clipboard._originalClip = Clipboard.get();
  } else {
    data = Clipboard.get();
  }

  if (data) {
    Clipboard.set('');
  }
  return fn.apply(Clipboard, args);
};


var getSelectedText = function() {
  return withClipboard(function() {
    this.copy();
    wait();
    return this.get();
  });
};


var print = function(text) {
  return withClipboard(function() {
    if (text) {
      this.set(text);
      wait();
      this.paste();
    }
    return this;
  });
};


exports.clip = {
  Clipboard: Clipboard,
  withClipboard: withClipboard,
  getSelectedText: getSelectedText,
  print: print,
  copy: Clipboard.copy,
  paste: Clipboard.paste,
  cut: Clipboard.cut
};


