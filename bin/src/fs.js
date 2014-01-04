/**
 * Local file system utility
 *
 * http://nodejs.org/api/fs.html
 * http://nodejs.jp/nodejs.org_ja/docs/v0.10/api/fs.html
 */

exports.fs.renameSync = function(oldPath, newPath) {
  return withFileSystemObject(function() {
    this.GetFile(oldPath).Name = newPath;
  });
};


exports.fs.statSync = function(path) {
  return withFileSystemObject(function() {
    var f = this.GetFile(path);
    var stat = {
      size: f.size,
      atime: f.DateLastAccessed,
      mtime: f.DateLastModified,
      ctime: f.DateCreated
    };
    return f = null, stat;
  });
};


exports.fs.unlinkSync = function(path, force) {
  return withFileSystemObject(function() {
    return this.DeleteFile(path, force);
  });
};


exports.fs.existsSync = function(path) {
  return withFileSystemObject(function() {
    return this.FileExists(path);
  });
};


//XXX: Read as binary when omitted encoding
exports.fs.readFileSync = function(filename, encoding) {
  if (/^_?auto/i.test(encoding)) {
    encoding = '_autodetect_all';
  } else {
    encoding || (encoding = 'UTF-8');
  }

  return withStream(function() {
    this.Type = 2;
    this.Charset = encoding;
    this.Open();
    this.LoadFromFile(filename);
    return this.ReadText(-1);
  });
};


exports.fs.writeFileSync = function(filename, data, encoding) {
  if (/^_?auto/i.test(encoding)) {
    encoding = '_autodetect_all';
  } else {
    encoding || (encoding = 'UTF-8');
  }

  var trimBOM = false;
  var skipLen = 0;

  if (/^UTF-?8$/i.test(encoding)) {
    skipLen = 3;
    trimBOM = true;
  } else if (/^UTF-?16$/i.test(encoding)) {
    skipLen = 2;
    trimBOM = true;
  }

  var stream = new Stream();
  stream.Type = 2;
  stream.Charset = encoding;
  stream.Open();
  stream.WriteText(data);

  if (trimBOM) {
    stream.Position = 0;
    stream.Type = 1;
    stream.Position = skipLen;
    var binary = stream.Read();
    stream.Close(), stream = null;

    stream = new Stream();
    stream.Type = 1;
    stream.Open();
    stream.Write(binary);
  }
  stream.SaveToFile(filename, 2);
  stream.Close(), stream = null;
};


// extra functions: copySync
exports.fs.copySync = function(src, dst, overwrite) {
  return withFileSystemObject(function() {
    return this.CopyFile(src, dst, overwrite);
  });
};


// extra functions: moveSync
exports.fs.moveSync = function(src, dst) {
  return withFileSystemObject(function() {
    return this.MoveFile(src, dst);
  });
};

