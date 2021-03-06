'use strict';

var utils = require('loader-utils');

var babel = require('babel-core');

var transform = require('./transform');

module.exports = function(source) {
  this.cacheable();

  var filename = utils.getCurrentRequest(this);

  var nodeResult = transform(source, filename);

  var result = babel.transform(nodeResult.code, {
    sourceFileName: filename,
    sourceMaps: true,
    inputSourceMap: nodeResult.map
  });

  this.callback(null, result.code, result.map);
};
