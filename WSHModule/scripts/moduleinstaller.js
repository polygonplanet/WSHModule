// WSHModule: Module Installer

var url = prompt('[Module Installer] Enter module (.js) URL:', 'http://');

if (typeof url !== 'string') {
  return;
}

if (!/^https?:\/\/[^\/]+\/.+[.]js$/i.test(url)) {
  alert('Error: invalid URL');
  return;
}

var req = new XMLHttpRequest();
req.open('GET', url, false);
req.send();

var content = req.responseText;
req = null;
console.log(content, 'Source:');

if (!content.trim() || /^\s*<(?:![d-]|[a-z])[^>]*>/i.test(content)) {
  alert('Error: invalid module');
  return;
}


var uri = require('uri');
var WSHModule_ = (function() { return this; }()).WSHModule;
var moduleDir = uri.dirname(uri.normalize([
  WSHModule_.scriptDir,
  '..',
  'modules',
  'dummy'
].join(uri.sep)));

var moduleName = ('' + (uri.parse(url).filename.match(/(\w+)/) ||
                 [])[1]).toLowerCase();
var moduleFilename = moduleName + '.js';
var modulePath = moduleDir + uri.sep + moduleFilename;


if (!/\bexports\b/.test(content)) {
  if (/\bwindow\b/.test(content)) {
    content = [
      'var window = {}, document = {};',
      content + ';',
      'exports.' + moduleName + '=window.' + moduleName + ';'
    ].join('\n');

    alert("Note: Module does not have 'exports'.\n" +
          "Installation converts window to exports.");

  } else {
    alert('Error: invalid module');
    return;
  }
}


var res = confirm('Install ' + moduleName + '? *Note malicious scripts.*');
if (!res) {
  return;
}

var fs = require('fs');
if (fs.existsSync(modulePath)) {
  if (!confirm(modulePath + ' is already exists. Overwrite?')) {
    return;
  }
}

fs.writeFileSync(modulePath, content, 'utf-8');

alert('Install completed.');


