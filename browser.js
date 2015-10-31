'use strict';

var transform = require('./transform');

var babel = require('babel-core/browser');

module.exports = function(source, filename) {
  var nodeResult = transform(source, filename);

  var result = babel.transform(nodeResult.code, {
    sourceFileName: filename,
    sourceMaps: true,
    inputSourceMap: nodeResult.map
  });

  return result;
};
