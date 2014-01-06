WSHModule
=========

WSHModule is a JavaScript virtual machine built in WSH/JScript.
It is a subset of the JavaScript executable engine that supports to compatible with the ECMAScript 5 standard in WSH/JScript.

WSHModule's script run at module scope (CommonJS/UMD) that means it can use `require`, `exports` and `module` objects.

WSHModule has a policy that aims to ECMAScript more standard, to reduce the extra extension.


## Compatibility

Currently work in:

  * Windows 8/8.1
  * Windows 7 (32bit/64bit)
  * Windows XP

WSHModule will work with WSH version 5.6 or later.

## Features

WSHModule supports the following features:

  * Supports ECMAScript5 standard syntax.
  * Supports CommonJS Universal Module Definition (UMD).
  * Available with UTF-8 script file.
  * Supports basic DOM functions: alert/confirm/prompt, setTimeout/clearTimeout and setInterval/clearInterval.
  * Supports a console window.
  * Fixed JScript bug: String.prototype.substr, indexOf and splice functions to standard ECMA-262.
  * Supports basic builtin modules (clip, console, fs, uri, util, vm).


## ToDo

  * Can't use `Getter` and `Setter`.
  * `"use strict"` syntax support.
  * `finally` statement will not called when `catch` statement omitted (JScript's bug).

## Quickstart usage

WSHModule not use file type association and Windows environment (eg., PATH etc).

Quick test:

Execute(drag-drop) `scripts/test.js` to `scripts/RunWSHModule.wsf`.
or
`cmd>wscript "/path/to/scripts/RunWSHModule.wsf" "your-script-path.js"`


RunWSHModule.wsf is a shortcut of `bin/wshmodule.wsf` execution.


file definitions are following:

 * bin/wshmodule.wsf : WSHModule executable engine.

   Simple usage:  
   `cmd>wscript "/path/to/bin/wshmodule.wsf" "your-script-path.js"`

 * bin/ClipConsole.exe : A helper exe for console and clipboard access.  
   ClipConsole's source code: bin/src/ClipConsole

 * bin/src/compile.js : A WSHModule source code compiler.  
   You can build your sources by execute(dblclick) compie.js. work with WSH/JScript.


## License

Public Domain

## Authors

* [polygon planet](https://github.com/polygonplanet) (twitter: [polygon_planet](http://twitter.com/polygon_planet))

