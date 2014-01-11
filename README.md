WSHModule
=========

WSHModule is a JavaScript virtual machine built in WSH/JScript.
It is a subset of the JavaScript executable engine that supports to compatible with the ECMAScript 5 standard in WSH/JScript.

WSHModule's script run at module scope (CommonJS/UMD) that means it can use `require`, `exports` and `module` objects.

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
  * Working with UTF-8 encoding.
  * Supports standard DOM functions: alert/confirm/prompt, setTimeout/clearTimeout and setInterval/clearInterval.
  * Supports a console window.
  * Fixed JScript bug: try-finally statements, String.prototype.substr, indexOf and Array.prototype.splice functions to standard ECMA-262.
  * Supports built in modules (console, fs, util, uri, vm, clip).


## ToDo

  * `Getter` and `Setter` support.
  * `"use strict"` syntax support.

## Quickstart usage

Runs script with WSHModule:  

`cmd>wscript "bin/wshmodule.wsf" "/path/to/myscript.js"`  

or  

Execute(drag-drop) `/path/to/myscript.js` to `bin/wshmodule.wsf`


## File Overview

Currently, WSHModule does not use file type association and Windows environment (eg., PATH etc).

file definitions are following:

 * `bin/wshmodule.wsf` : WSHModule script engine.

 * `bin/ClipConsole.exe` : helper for console and clipboard access.  
   Note WSH/JScript can't access to clipboard without security dialog.  
   ClipConsole's source code: `bin/src/ClipConsole`

 * `bin/src/compiler.js` : WSHModule source code compiler.  
   compiler.js provides to build `wshmodule.wsf` from sources `bin/src/*.js`  
   compile: `cmd>wscript "bin/src/compiler.js"` or execute (dblclick) compiler.js

## Test

Runs test script:  

  1. `>rename WSHModule-master WSHModule` if downloaded zip from master.
  2. `>cd WSHModule`
  3. `>wscript "bin/wshmodule.wsf" "scripts/test.js"`


## License

Public Domain

## Authors

* [polygon planet](https://github.com/polygonplanet) (twitter: [polygon_planet](http://twitter.com/polygon_planet))

