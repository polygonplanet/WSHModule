// execute/dragdrop this file to RunWSHModule.wsf

var ex = require('example');
console.log(ex,'example');

alert('example():'+ex.example());
alert('example2():'+ex.example2());
alert('exampleArg():'+ex.exampleArg(100));
alert('exampleObject.hello():'+ex.exampleObject.hello());
alert('exampleObject.formatTest():'+ex.exampleObject.formatTest());

setTimeout(function() {
  alert("Hello! in Timer!");
}, 5000);


