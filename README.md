WSHModule
=========

WSHModule is a JavaScript virtual machine built in WSH/JScript.

It is a subset of the JavaScript interpreter that supports to compatible with the ECMAScript 5 standard in WSH/JScript.
WSHModule's script run at module scope (CommonJS/UMD) that means it can use `require`, `exports` and `module` objects.
WSHModule can assist to upgrade JScript in Windows Script Host as much as possible to approach the ECMA-262 standard.

Possibly, better to use Node.js it would be quickly.
However, JScript has been bundled with Windows.
Improves a local environment when run a batch script with extension "js" by the passage to WSHModule.


## Compatibility

  * Windows (32bit/64bit)

WSHModule will work with WSH version 5.6 or later.

Currently, WSHModule does not use file type association and Windows environment (eg., PATH).

## Features

WSHModule supports the following features:

  * Supports ECMAScript5 standard syntax.
  * Supports CommonJS Universal Module Definition (UMD).
  * Working with UTF-8 encoding.
  * Supports standard DOM functions: alert/confirm/prompt, setTimeout/clearTimeout and setInterval/clearInterval.
  * Supports a console window.
  * Fixed JScript bug: try-finally statements, String.prototype.substr, Array.indexOf and Array.prototype.splice functions to standard ECMA-262.


## Quickstart usage

Runs script with WSHModule:  

`WSHModule.exe "C:/path/to/myscript.js"`  

or  

Execute (drag-drop) `C:/path/to/myscript.js` to `WSHModule.exe`



#### Simple way:  

  1. Create a shortcut of WSHModule.exe to desktop.
  2. Execute script by drag-drop to shortcut.


## Tests

Runs test script:  

  1. `cd WSHModule`
  2. `"bin/WSHModule.exe" "scripts/test.js"`


## ToDo

  * `Getter` and `Setter` support.
  * `"use strict"` syntax support.

## License

Public Domain

## Authors

* [polygon planet](https://github.com/polygonplanet) (twitter: [polygon_planet](http://twitter.com/polygon_planet))

