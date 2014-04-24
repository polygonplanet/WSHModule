// example for Shift_JIS encoding system
var util = require('util');
var fs = require('fs');

fs.writeFileSync(__dirname + '/これはSJISです.txt', 'これはSJISです', 'Shift_JIS');
alert('"これはSJISです.txt" を作成しました');

