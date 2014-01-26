
function example() {
  return 'example';
}

function example2() {
  return 'example2';
}

function exampleArg(arg) {
  return 'exampleArg: ' + arg;
}


exports.example = example;
exports.example2 = example2;
exports.exampleArg = exampleArg;

exports.exampleObject = {
  hello: function() {
    return 'Hello';
  },
  formatTest: function() {
    var util = require('util');
    return util.format('%d == %d', '0xff', 255);
  }
};

