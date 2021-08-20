
# Svg text to path

[![NPM version](http://img.shields.io/npm/v/svg-text-to-path.svg?style=flat)](https://www.npmjs.org/package/svg-text-to-path)
[![Downloads](https://img.shields.io/npm/dt/svg-text-to-path.svg)](https://www.npmjs.org/package/svg-text-to-path)
![License](https://img.shields.io/npm/l/svg-text-to-path.svg)

Convert svg <text> nodes to vector font-free <path> elements.

Features:

- support otf/ttf fonts;
- integrated with Google Fonts;
- different fonts library: directory (nodejs), http-repository, map or your own handler;
- support CSS `text-anchor` and `dominant-baseline` properties;
- support nodejs and browser runtime;

[DEMO](https://paulzi.github.io/svg-text-to-path/index.html)

## Install

Install in project:

```bash
npm i svg-text-to-path --save
```

Install globally (i. e. using CLI-interface from anywhere):

```bash
npm i -g svg-text-to-path
```

## Usage

### Command line

```bash
svg-text-to-path [options] [input file]
```

Support pipes:

```bash
cat in.svg | svg-text-to-path [options] >out.svg
```

```
Options:
  -o, --output          output path (default equal input)
  -c, --config          path to config file (in JSON format)
  -d, --fonts-dir       path to fonts dir (dir structure: ./[family]/[wght][?i].[otf|ttf])
  -u, --fonts-url       url to web repository of fonts (dir structure: ./[family]/[wght][?i].[otf|ttf])
  -s, --selector        css selector for find and replace <text> nodes
  -m, --merged          merge each text node in single path
  -p, --decimals        decimal places in <path> coordinates
  -t, --strict          stop process with error on missed fonts
  -z, --default-font    font for replace missed fonts (format: "family:wght:ital")
  -k, --kerning         enable kerning (default: true)
  -h, --hinting         enable hinting (default: false)
  -f, --features        comma separated list og opentype font features (liga, rlig)
  -l, --letter-spacing  letter spacing value
  -g, --google-api-key  google api key for using Google Fonts

In config file you can specify "fontMap" key:
"fontMap": {
    "Roboto": {
        "400": "fonts/roboto-400.ttf",
        "400i": "http://example.com/roboto/400i.ttf"
    }
}
```

### Code

Import required functions from library:

```javascript
import { replaceAllInString } from 'svg-text-to-path';
import mapHandler from 'svg-text-to-path/handlers/map.js';
import googleHandler from 'svg-text-to-path/handlers/google.js';

let out = await replaceAllInString(svg, {
    googleApiKey: '...',
    handlers: [mapHandler, googleHandler],
});
```

Or include `dist/svg-text-to-path.js` and use `window.SvgTextToPath` object:

```javascript
SvgTextToPath.replaceAll(document.querySelector('svg'), {
    googleApiKey: '...',
    handlers: [SvgTextToPath.handlers.map, SvgTextToPath.handlers.google],
});
```

## Documentation

Exports:

- `getFont(style[, params = {}])` - create URL for import font using [CSS API v2](https://developers.google.com/fonts/docs/css2);
    - `style {Object}` - object represent font style;
        - `family {String}` - family name;
        - `wght {Number}` - font weight;
        - `ital {Number}` - font italic style (0 or 1);
    - `params {Object}` - additional params (including handler params);
        - `handlers {Function[]}` - array of font source handlers (see handlers);
    - `@returns {import('opentype.js').Font}` - opentype.js Font object or null if font file not found.

- `setFont(style, font)` - set font in internal font cache;
    - `style {Object}` - font style object (see more `getFont()`);
    - `font {import('opentype.js').Font}` - opentype.js Font object.

- `getFontForNode(textNode[, params = {}])` - get font for svg `<text>` element;
    - `textNode {SVGTextElement}` - svg `<text>` element;
    - `params {Object}` - additionaly params;
        - `onFontNotFound: {String|Function}` - handler on missed fonts, if `'error'` - stop process with error;
        - `defaultFont: {Object}` - default font style replace for missed fonts (see `getFont()`);
        - and params from `getFont()`;
    - `@returns {Object}` - opentype.js Font object or null if font file not found;
        - `font {import('opentype.js').Font}` - opentype.js Font object or null if font file not found;
        - `fontStyle {Object}` - font style object (see more getFont());
        - `style {Object}` - current style for `<text>` element.

- `getPaths(textNode[, params = {}])` - get opentype.js Path objects from `<text>` element (separated glyphs);
    - `textNode {SVGTextElement}` - svg `<text>` element;
    - `params {Object}` - additionaly params;
        - `merged {Boolean}` - use single path for all glyph;
        - and params from `getFontForNode()`;
    - `@returns {null|import('opentype.js').Path[]}` - array of opentype.js Path objects or null if font file not found.

- `getPath(textNode[, params = {}])` - get opentype.js Path objects from `<text>` element (separated glyphs);
    - `textNode {SVGTextElement}` - svg `<text>` element;
    - `params {Object}` - additionaly params (see `getPaths()`);
    - `@returns {import('opentype.js').Path[]}` - opentype.js Path object or null if font file not found.

- `replace(textNode[, params = {}])` - replace `<text>` with `<path>` element;
    - `textNode {SVGTextElement}` - svg `<text>` element;
    - `params {Object}` - additionaly params;
        - `decimals: {Number}` - decimal places in `<path>` coordinates;
        - and params from `getPaths()`;
    - `@returns {?SVGPathElement[]}` - return array of `<path>` element or null if font file not found.

- `replaceAll(svgElement[, params = {}])` - replace `<text>` elements in `<svg>`;
    - `svgElement {SVGSVGElement}` - `<svg>` element;
    - `params {Object}` - additionaly params;
        - `selector {String}` - CSS selector for find and replace <text> nodes;
        - and params from `replace()`;
    - `@returns {{total: Number, success: Number}}` - stats object.

- `getSvgElement(svg)` - convert svg from string to DOM element (using jsdom for nodejs);
    - `svg {String}` - svg string content;
    - `@returns {SVGSVGElement}` - `<svg>` element.

- `replaceAllInString(svg[, params = {}])` - replace input svg-content string to output string;
    - `svg {String}` - svg string content;
    - `@returns {String}` - svg string content with replaced `<text>`.

## Handlers

### Map handler

Get font url/path fron `fontMap` parameter. Structure of map: `fontMap[family][fontMod]`:

```
"fontMap": {
    "Roboto": {
        "400": "fonts/roboto-400.ttf",
        "400i": "http://example.com/roboto/400i.ttf"
    }
}
```

```javascript
import mapHandler from 'svg-text-to-path/handlers/map.js';
```

Exports:

- `default(style, params) {AsyncFunction}` - handler;
    - `style {Object}` - font style object (see `getFont()`);
    - `params {Object}` - additionaly params;
        - `fontMap {Object}` - font map structure;
    - `@returns {?String}` - string url/path or null.

### Dir handler

Find font in dir `fontsDir`. Directory structure: `./[family]/[wght][?i].[otf|ttf]`.

```javascript
import dirHandler from 'svg-text-to-path/handlers/dir.js';
```

Exports:

- `default(style, params) {AsyncFunction}` - handler;
    - `style {Object}` - font style object (see `getFont()`);
    - `params {Object}` - additionaly params;
        - `fontsDir {String}` - path to dir;
    - `@returns {?String}` - string path or null if font not found.

### Http handler

Find font in web repository `fontsUrl`. Directory structure: `./[family]/[wght][?i].[otf|ttf]`.

For finding font, handler make HEAD requests.

```javascript
import httpHandler from 'svg-text-to-path/handlers/http.js';
```

Exports:

- `default(style, params) {AsyncFunction}` - handler;
    - `style {Object}` - font style object (see `getFont()`);
    - `params {Object}` - additionaly params;
        - `fontsUrl {String}` - url of repository;
    - `@returns {?String}` - string path or null if font not found.

### Google handler

Find font in Google Fonts repository. You must provide API key in `googleApiKey`.

For information on how to get the API key, see https://developers.google.com/fonts/docs/developer_api .

```javascript
import googleHandler from 'svg-text-to-path/handlers/google.js';
```

Exports:

- `default(style, params) {AsyncFunction}` - handler;
    - `style {Object}` - font style object (see `getFont()`);
    - `params {Object}` - additionaly params;
        - `googleApiKey {String}` - Google Fonts API key;
    - `@returns {?String}` - string path or null if font not found.

## Browser support

All modern browsers (IE RIP).