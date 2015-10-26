var expect = require('chai').expect;

// Do a mock.
var utils = require('loader-utils');
utils.getCurrentRequest = function() {
  return 'Document.md';
};

var React = require('react');
var ReactDOMServer = require('react-dom/server');

var ReactMarkdownLoader = require('../index');

var runLoader = function(source, cb) {
  var context = {
    cacheable: function() {},
    callback: function(_, code, map) {
      module.exports = {};
      eval(code);
      cb(
        module.exports,
        ReactDOMServer.renderToStaticMarkup(
          React.createElement(module.exports)
        ),
        map
      );
    }
  };
  ReactMarkdownLoader.bind(context)(source);
};

describe('react-markdown-loader', function() {
  it('should work', function() {
    runLoader('does this work', function(exported, markup, map) {
      expect(markup).to.equal('<div><p data-line="1">does this work</p></div>');
    });
    runLoader('---\ntitle: hmm\n---\ndoes *this* work?', function(exported, markup, map) {
      expect(markup).to.equal('<div><p data-line="4">does <em>this</em> work?</p></div>');
      expect(exported.meta.title).to.equal('hmm');
    });
  });
  it('allows JS interpolation', function() {
    runLoader('<p className={"foo" + 2}>test</p>', function(exported, markup, map) {
      expect(markup).to.equal('<div><p class="foo2">test</p></div>');
    });
  })
});
