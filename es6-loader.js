'use strict';

var transform = require('./transform');

var babel = require('babel-core/browser');

exports.translate = function(load) {
  var nodeResult = transform(load.source, load.name);

  var result = babel.transform(nodeResult.code, {
    sourceFileName: load.name,
    sourceMaps: true,
    inputSourceMap: nodeResult.map
  });

  load.metadata.sourceMap = result.map;
  return result.code;
};
