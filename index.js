'use strict';

var metaMarked = require('meta-marked');
var babel = require('babel-core');

module.exports = function(source) {
  var compiled = metaMarked(source);
  var meta = compiled.meta || {};

  var code = [
    'var React = require("react");',
    'module.exports = React.createClass({',
    '  render: function() {',
    '    return <div>' + compiled.html + '</div>;',
    '  }',
    '});',
    'module.exports.meta = ' + JSON.stringify(meta) + ';'
  ].join('\n');

  var result = babel.transform(code);
  this.callback(null, result.code, result.map);
};
