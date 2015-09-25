# React Markdown loader

Work in progress. Intended to be a spiritual successor to [reactdown](https://github.com/andreypopp/reactdown).

## Usage

```javascript
var React = require('react');

var Post = require('react-markdown!./post.md');

React.render(<Post />, document.getElementById('container'));
```

and build with Webpack.
