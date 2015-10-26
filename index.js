'use strict';

var utils = require('loader-utils');

var matter = require('gray-matter');
var matterParsers = require('gray-matter/lib/parsers');

var md = require('markdown-it')();

var babel = require('babel-core');

var sourceMap = require('source-map');
var SourceNode = sourceMap.SourceNode;

// From https://github.com/markdown-it/markdown-it/blob/master/support/demo_template/index.js#L93
function injectLineNumbers(tokens, idx, options, env, slf) {
  var line;
  if (tokens[idx].map && tokens[idx].level === 0) {
    line = 1 + options.frontRowCount + tokens[idx].map[0];
    tokens[idx].attrPush([ 'data-line', String(line) ]);
  }
  return renderTokenAsNode(tokens, idx, options, env, slf);
}

function renderTokenAsNode(tokens, idx, options) {
  // Based on Renderer.renderToken, but remembers the source map.

  var result = (function() {
    var nextToken,
        result = '',
        needLf = false,
        token = tokens[idx];

    if (token.hidden) {
      return '';
    }

    if (token.block && token.nesting !== -1 && idx && tokens[idx - 1].hidden) {
      result += '\n';
    }
    result += (token.nesting === -1 ? '</' : '<') + token.tag;
    result += md.renderer.renderAttrs(token);
    if (token.nesting === 0) { // Always self-close for JSX.
      result += ' /';
    }
    if (token.block) {
      needLf = true;

      if (token.nesting === 1) {
        if (idx + 1 < tokens.length) {
          nextToken = tokens[idx + 1];

          if (nextToken.type === 'inline' || nextToken.hidden) {
            needLf = false;
          } else if (nextToken.nesting === -1 && nextToken.tag === token.tag) {
            needLf = false;
          }
        }
      }
    }
    result += needLf ? '>\n' : '>';
    return result;
  })();

  var map = tokens[idx].map;
  var row = null, col = null;
  if (map) {
    row = 1 + options.frontRowCount + map[0]; col = map[1];
  }
  return new SourceNode(row, col, options.filename, result);
}

function renderTokensAsNode(tokens, options) {
  var nodes = [];
  for (var i = 0; i < tokens.length; i++) {
    var type = tokens[i].type;
    if (type === 'inline') {
      nodes.push(md.renderer.renderInline(tokens[i].children, { xhtmlOut: true }));
    } else if (type === 'paragraph_open' || type === 'heading_open') {
      nodes.push(injectLineNumbers(tokens, i, options));
    } else {
      nodes.push(renderTokenAsNode(tokens, i, options));
    }
  }
  return new SourceNode(null, null, null, nodes);
}

module.exports = function(source) {
  this.cacheable();

  var filename = utils.getCurrentRequest(this);

  var frontRowCount = 0;
  var m = matter(source, {
    parser: function(str, options) {
      // Also account for --- and ---.
      frontRowCount = str.split('\n').length + 2;
      return matterParsers.yaml(str, options);
    }
  });
  var meta = m.data;

  var tokens = md.parse(m.content);

  var node = new SourceNode(null, null, filename, [
    'var React = require("react");',

    'styles' in meta ? [
      'var styles = [',
      meta.styles.map(function(path) {
        return 'require("' + path + '"),';
      }),
      '];'
    ] : [
      'var styles = [];'
    ],

    'requires' in meta ? (function() {
      var lines = [];
      for (var name in meta.requires) {
        lines.push('var ' + name + ' = require("' + meta.requires[name] + '");');
      }
      return lines;
    })() : [],

    'module.exports = React.createClass({',
    '  render: function() {',
    '    return (',
    '<div>',
    new SourceNode(null, null, filename, [
      renderTokensAsNode(tokens, {
        filename: filename,
        frontRowCount: frontRowCount
      }),
      '</div>'
    ]),
    '    );',
    '  }',
    '});',
    'module.exports.styles = styles;', // Full CSS file content, intended to be loaded by React renderer.
    'module.exports.meta = ' + JSON.stringify(meta) + ';'
  ]).join('\n');
  var nodeResult = node.toStringWithSourceMap({
    file: filename
  });
  nodeResult.map.setSourceContent(filename, source);

  var result = babel.transform(nodeResult.code, {
    sourceFileName: filename,
    sourceMaps: true,
    inputSourceMap: nodeResult.map.toJSON()
  });
  this.callback(null, result.code, result.map);
};
