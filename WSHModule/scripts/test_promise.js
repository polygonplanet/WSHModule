// WSHModule: example test script

// Example Module Installing:
// 1. Run moduleinstaller.js
// 2. Enter Promise.js URL (e.g., http://www.promisejs.org/implementations/promise/promise-3.2.0.js
//    in https://github.com/then/promise) and Install.
// 3. Tests Promise, Run this script.

var Promise = require('promise');

// via https://github.com/then/promise
var TEXT_URL = 'https://raw.githubusercontent.com/then/promise/master/Readme.md';

var p = get(TEXT_URL).then(function(res) {
  console.log(res, 'Success!');
}, function(err) {
  console.log(err, 'Failed!');
});


function get(url) {
  return new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();

    req.onreadystatechange = function() {
      if (req.readyState === 4) {
        if (req.status === 200) {
          resolve(req.responseText);
        } else {
          reject(req.responseText);
        }
      }
    };

    req.open('GET', url, true);
    req.send();
  });
}

