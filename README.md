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

## Dev

* `bin/src/WSHModule` is built on Lazarus (Free Pascal)

## Build

1. Copy `bin/wshmodule.wsf` and `bin\wshmshell.js` to `bin/src/WSHModule` folder.
2. Download [Lazarus IDE](https://www.lazarus-ide.org/)
3. Project -> Open Project -> Open `bin/src/WSHModule/WSHModule.lpr` (Change `All files (*.*)`)
4. Confirm dialog `The file "WSHModule.lpr" is not a Lazarus project. Create a new project for this "program"?` -> `Create project`
5. Select `Application`
6. **Run** (Menu `Run -> Run`) or **Build** (Menu `Run -> Build`)

You can get a `WSHModule.exe` by build, and also run JavaScript with WSHModule console, for example, typing `1+1` and press enter key in the console window, you can get result `2`.

## License

Public Domain

## Credits

This project is using on the following excellent free yet copyrighted open source softwares. We follow the policies of those software packages.

* [superobject](https://github.com/hgourvest/superobject) (MPL1.1)
