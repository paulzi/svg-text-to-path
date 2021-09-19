
# Documentation

SVG text to path documentation.

## Exports

- `getFont(style[, params = {}])` - get Font instance for font style;
    - `style {Object}` - object represent font style;
        - `family {String}` - family name;
        - `wght {Number}` - font weight;
        - `ital {Number}` - font italic style (0 or 1);
    - `params {Object}` - additional params;
        - `handlers {Function[]}` - array of font source handlers (see handlers);
    - `@returns {Promise<import('opentype.js').Font>}` - opentype.js Font object or null if font file not found.

- `setFont(style, font)` - set font in internal font cache;
    - `style {Object}` - font style object (see more `getFont()`);
    - `font {import('opentype.js').Font}` - opentype.js Font object.

- `getFontForNode(textNode[, params = {}])` - get opentype.js Font instance for svg <text> or <tspan> node;
    - `textNode {SVGTextElement|SVGTSpanElement}` - svg `<text>` or `<tspan>` element;
    - `params {Object}` - additionaly params;
        - `onFontNotFound: {String|Function}` - handler on missed fonts, if `'error'` - stop process with error;
        - `defaultFont: {Object}` - default font style replace for missed fonts (see `getFont()`);
        - and params from `getFont()`;
    - `@returns {Promise<Object>}` - opentype.js Font object or null if font file not found;
        - `font {import('opentype.js').Font}` - opentype.js Font object or null if font file not found;
        - `fontStyle {Object}` - font style object (see more getFont());
        - `style {CSSStyleDeclaration}` - current style for element.

- `getPaths(textNode[, params = {}])` - get opentype.js Path objects from `<text>` element (separated glyphs, `<tspan>` not support there);
    - `textNode {SVGTextElement}` - svg `<text>` element;
    - `params {Object}` - additionaly params;
        - `merged {Boolean}` - use single path for all glyph;
        - and params from `getFontForNode()`;
    - `@returns {Promise<?import('opentype.js').Path[]>}` - array of opentype.js Path objects or null if font file not found.

- `getPath(textNode[, params = {}])` - get opentype.js Path objects from `<text>` element (merged glyphs, `<tspan>` not support there);
    - `textNode {SVGTextElement}` - svg `<text>` element;
    - `params {Object}` - additionaly params (see `getPaths()`);
    - `@returns {Promise<?import('opentype.js').Path>}` - opentype.js Path object or null if font file not found.

- `replace(textNode[, params = {}])` - replace `<text>` with `<path>` element;
    - `textNode {SVGTextElement}` - svg `<text>` element;
    - `params {Object}` - additionaly params;
        - `group: {Boolean}` - use group `<g>` tag for each text (ignored if merged);
        - `textAttr: {String}` - save `<text>` innerHTML to attribute;
        - `decimals: {Number}` - decimal places in `<path>` coordinates;
        - and params from `getPaths()`;
    - `@returns {Promise<SVGPathElement|SVGPathElement[]|SVGGElement|null>}` - return `<g>` if `<text>` has `<tspan>`, `<path>` if `merged` is true, `<g>` if `group` is true, otherwise array of `<path>`.

- `replaceAll(svgElement[, params = {}])` - replace `<text>` elements in `<svg>`;
    - `svgElement {SVGSVGElement}` - `<svg>` element;
    - `params {Object}` - additionaly params;
        - `selector {String}` - CSS selector for find and replace `<text>` nodes;
        - and params from `replace()`;
    - `@returns {Promise<{total: Number, success: Number}>}` - stats object.

- `getSvgElement(svg)` - convert svg from string to DOM element (using jsdom for nodejs);
    - `svg {String}` - svg string content;
    - `@returns {SVGSVGElement}` - `<svg>` element.

- `replaceAllInString(svg[, params = {}])` - replace input svg-content string to output string;
    - `svg {String}` - svg string content;
    - `params {Object}` - additionaly params (see `replaceAll()`);
    - `@returns {Promise<String>}` - svg string content with replaced `<text>`.

- `convertTSpanText(textNode[, params = {}])` - convert `<text>` with `<tspan>` to `<g>` with multiple `<text>`;
    - `textNode {SVGTextElement}` - target text node;
    - `params {Object}` - additionaly params (see `getFontForNode()`);
    - `@returns {Promise<SVGGElement>}` - `<g>` element.

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

- `default(style, params)` - handler;
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

- `default(style, params)` - handler;
    - `style {Object}` - font style object (see `getFont()`);
    - `params {Object}` - additionaly params;
        - `fontsDir {String}` - path to dir;
    - `@returns {Promise<?String>}` - string path or null if font not found.

### Http handler

Find font in web repository `fontsUrl`. Directory structure: `./[family]/[wght][?i].[otf|ttf]`.

For finding font, handler make HEAD requests.

```javascript
import httpHandler from 'svg-text-to-path/handlers/http.js';
```

Exports:

- `default(style, params)` - handler;
    - `style {Object}` - font style object (see `getFont()`);
    - `params {Object}` - additionaly params;
        - `fontsUrl {String}` - url of repository;
    - `@returns {Promise<?String>}` - string path or null if font not found.

### Google handler

Find font in Google Fonts repository. You must provide API key in `googleApiKey`.

For information on how to get the API key, see https://developers.google.com/fonts/docs/developer_api .

```javascript
import googleHandler from 'svg-text-to-path/handlers/google.js';
```

Exports:

- `default(style, params)` - handler;
    - `style {Object}` - font style object (see `getFont()`);
    - `params {Object}` - additionaly params;
        - `googleApiKey {String}` - Google Fonts API key;
    - `@returns {Promise<?String>}` - string path or null if font not found.
