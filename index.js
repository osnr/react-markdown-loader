'use strict';

var metaMarked = require('meta-marked');
var babel = require('babel-core');

module.exports = function(source) {
  var compiled = metaMarked(source);
  var meta = compiled.meta || {};

  var lines = [
    'var React = require("react");'
  ];
  if ('styles' in meta) {
    lines.push('var styles = [');
    meta.styles.forEach(function(path) {
      lines.push('require("' + path + '"),');
    });
    lines.push('];')
  }
  if ('requires' in meta) {
    for (var name in meta.requires) {
      lines.push('var ' + name + ' = require("' + meta.requires[name] + '");');
    }
  }

  lines = lines.concat([
    'module.exports = React.createClass({',
    '  render: function() {',
    '    return <div>' + compiled.html + '</div>;',
    '  }',
    '});',
    'module.exports.styles = styles;', // Full CSS file content, intended to be loaded by React renderer.
    'module.exports.meta = ' + JSON.stringify(meta) + ';'
  ]);

  var code = lines.join('\n');

  var result = babel.transform(code);
  this.callback(null, result.code, result.map);
};
