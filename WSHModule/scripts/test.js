// WSHModule: example test script

var ex = require('example');

console.log(ex,'var ex = require("example");\nconsole.log(ex):');
console.log(this,'console.log(this):');

console.log(ex.example(), 'ex.example():');
console.log(ex.example2(), 'ex.example2():');
console.log(ex.exampleArg(100), 'ex.exampleArg(100):');
console.log(ex.exampleObject.hello(), 'ex.exampleObject.hello():');
console.log(ex.exampleObject.formatTest(), 'ex.exampleObject.formatTest():');

console.log('setTimeout(function() { alert("Hello! in Timer!") }, 3000):');

setTimeout(function() {
  alert("Hello! in Timer!");
}, 3000);

