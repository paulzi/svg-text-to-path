
# Documentation

SVG text to path documentation.

## Providers and renderers

When converting text, the library tries to find a font for each char in `font-family` list. To get font sources,
requests are made to font providers. Providers are passed in parameter `providers`. If no providers are found, they will
be created from static property `Session.defaultProviders` and passed parameters (`fontsUrl`, `useFontFace`, ...).

The library implements two dependencies for rendering glyphs from a font: `fontkint` and `opentype.js`. The renderer to
use is passed in parameter `renderer`. If not specified, it is taken from static property `Session.defaultRenderer`.

Advantages and disadvantages `fontkit` renderer:

- supports variable fonts;
- supports `woff`/`woff2` fonts;
- supports most features of fonts (`smcp`, `onum`, ...), `opentype.js` only supports `liga` and `rlig`;
- but the disadvantage is that the bundle weighs two times more.

Availability of provider list and renderers depends on the import method.

## Import variants

### Node.js

If using nodejs runtime just import default export of library.
All providers and renderers are available in static properties.

```javascript
import Session from 'svg-text-to-path';

console.log(Session.providers); // {ConfigProvider, FontFaceProvider, DirProvider, HttpProvider, GoogleProvider}
console.log(Session.renderers); // {FontkitFont, OpenTypeJsFont}
```

### Browser

Default target import includes `fontkit` renderer, and all providers except `DirProvider`:

```javascript
import Session from 'svg-text-to-path';
import Session from 'svg-text-to-path/entries/browser-fontkit.js'; // is equal to previous

console.log(Session.providers); // {ConfigProvider, FontFaceProvider, HttpProvider, GoogleProvider}
console.log(Session.renderers); // {FontkitFont}
```

`Opentype.js` variant:

```javascript
import Session from 'svg-text-to-path/entries/browser-opentypejs.js';

console.log(Session.providers); // {ConfigProvider, FontFaceProvider, HttpProvider, GoogleProvider}
console.log(Session.renderers); // {OpenTypeJsFont}
```

If you want to build the bundle as light as possible and only import certain providers, use their own import:

```javascript
import Session from 'svg-text-to-path/entries/browser.js';
import OpenTypeJsFont from 'svg-text-to-path/renderer/OpenTypeJsFont.js';
import ConfigProvider from 'svg-text-to-path/providers/config/ConfigProvider.js';

Session.defaultRenderer = OpenTypeJsFont;
Session.defaultProviders = [ConfigProvider];
```

You can also import in page already compiled bundles:

```html
<script src="`dist/svg-text-to-path-fontkit.js"></script> <!-- with `fontkit` renderer variant -->
<script src="`dist/svg-text-to-path-opentypejs.js"></script> <!-- with `opentype.js` renderer variant -->
```

And use `window.SvgTextToPath` object:

```javascript
console.log(window.SvgTextToPath);
console.log(SvgTextToPath.providers); // {ConfigProvider, FontFaceProvider, HttpProvider, GoogleProvider}
console.log(SvgTextToPath.renderers); // {FontkitFont/OpenTypeJsFont}
```

## Session config

- `renderer {Font}` - font rendering class;
- `providers {FontsProvider[]}` - font providers;
- `fontCache {Cache}` - font cache storage (can be created via `createCache()`);
- `familyClasses {{[key: String]: String[]}}` - dictionary of family categories (sans-serif, serif, ...) and corresponding array of families;
- `fallbackFamilies {String[]}` - array of fallback families (if no suitable font is found);
- `fallbackGlyph {[String, String|Number]}` - if no glyphs are found for a character in font-family list and `fallbackFamilies`, using family and codepoint or char for replace this glyph;
- `noFontAction {String}` - if the font for the char is not found, and fallback glyph is not set: `'skipNode'` - skip this `<text>` node, `'error'` - stop processing file and throw error, another values - skip char;
- `split {Boolean}` - split each glyph in separate path;
- `decimals {Number}` - decimal places in `<path>` coordinates (default: 2);
- `textAttr {String}` - save text content to attribute;
- `keepFontAttrs {Boolean}` - keep font representation attributes (`font-size`, `letter-spacing`, ...);
- `stat {Boolean|String}` - only for CLI and Server app, for CLI save statistics to json file (or output if `true`), for Server save stat to `X-Svg-Text-To-Path` header;
- `selector {String}` - only for CLI and Server app, specify css selector for find and replace `<text>` nodes (default: 'text');
- `port {Number}` - only for Server app, specify server port (default: 10000);
- `loadResources {Boolean}` - only for CLI, load external resources in SVG (default: false);
- `fonts {FontSourceMap}` - dictionary of array of font source (static create `ConfigProvider`);
- `useFontFace {Boolean}` - enable parsing @font-face css rules to find paths to fonts (static create `FontFaceProvider`);
- `useFontFaceAjax {Boolean}` - when stylesheet rules are not alllowed due CORS, rules will be load by ajax request (static create `FontFaceProvider`);
- `fontsDir {String}` - path to fonts dir, dir structure variants: static fonts (`./[family]/[wght][?i].[otf|ttf|woff|woff2]`), variable fonts (`./[family]/[axis],[from][?..to];[axis],[from][?..to].[otf|ttf|woff|woff2]`) (static create `DirProvider`);
- `fontsDirCache {Number}` - time to cache `DirProvider` (default: 0) (static create `DirProvider`);
- `fontsUrl {String}` - font repository URL, two options are possible: if placeholder "--family--" is present, then the repository will be loaded for each family, web service should return an array of font source objects, otherwise, one request is used, in response must be a dictionary of array of font source (static create `HttpProvider`);
- `fontsUrlCache {String}` - time to cache `HttpProvider` (default: 600000) (static create `HttpProvider`);
- `googleApiKey {String}` - Google Fonts API Key (static create `GoogleProvider`);
- `googleCache {String}` - time to cache `GoogleProvider` (default: 600000) (static create `GoogleProvider`);


## Exports

```javascript
import Session from 'svg-text-to-path';
```

- `constructor(svg[, params = {}])` - prepare replace session
    - `svg {SVGSVGElement|String}` - svg node or string (if provide a string in browser, svg node will be appended to document.body);
    - `params {Object}` - session parameters (see above);
- `get params()` - return session params;
- `getSvgString()` - return svg string;
    - `@returns {String}`;
- `destroy()` - destroy session (and remove helper svg-nodes from DOM);
- `getFontStyleForNode(node[, style])` - get `FontStyle` object with families list, variation axes and features;
    - `node {SVGElement}` - svg element;
    - `style {CSSStyleDeclaration}` - current computed style;
    - `@returns {FontStyle}`
        - `families {String[]}` - families list;
        - `axes {Object}` - variation dictionary;
        - `features {Object}` - font features;
- `replaceAll([selector = 'text'])` - replace all `<text>` in svg;
    - `selector {String}` - css selector for fint `<text>` elements;
    - `@returns {Promise<SessionStat>}` - return statistics object;
- `replace(node)` - replace `<text>` node;
    - `node {SVGTextElement}` - `<text>` element for replace;
    - `@returns {Promise<SessionReplaceStat>}` - return statistics object;
- `createCache(duration)` - create cache object for using in `fontCache` session params;
    - `duration {Number}` cache duration in ms;
- `@static defaultRenderer {FontkitFont|OpenTypeJsFont}` - renderer used if `renderer` param is not pass;
- `@static defaultProviders {FontsProvider[]}` - array of provider class, if `providers` param is not pass;
- `@static providers {Object}` - dictionary of allowed provider classes;
- `@static renderers {Object}` - dictionary of allowed renderer classes;

## Providers exports

### ConfigProvider

Get font source objects from config.
Will be created from `Session.defaultProviders` if parameter `fonts` is passed in session params:

```json
"fonts": {
    "Fira Sans": [
        {
            "wght": 400,
            "ital": 0,
            "source": "../fonts/Fira Sans/400.ttf"
        }
    ],
    "Tourney": [
        {
            "wdth": [75, 125],
            "wght": [100, 900],
            "source": "../fonts/Tourney/Tourney-Variable.ttf"
        }
    ]
}
```

```javascript
import ConfigProvider from 'svg-text-to-path/providers/config/ConfigProvider.js';
```

- `constructor(map)`;
    - `map {Object}` - font source dictionary;

### FontFaceProvider

Get font source objects from stylesheets `@font-face`.
Will be created from `Session.defaultProviders` if parameter `useFontFace` is true in session params.

**Warning! if an attempt to get rules from stylesheet fails due to CORS (for example, css from Google Fonts CSS API), then a AJAX-request will be made.**
**To avoid reloading styles add `crossorigin="anonymous"` to your `<link>` tag.**

```javascript
import FontFaceProvider from 'svg-text-to-path/providers/font-face/FontFaceProvider.js';
```

- `constructor()`;

### DirProvider

Find font in directory. Only for Node.js runtime. Directory structure variants:

- static fonts:   `./[family]/[wght][?i].[otf|ttf|woff|woff2]`
- variable fonts: `./[family]/[axis],[from][?..to];[axis],[from][?..to].[otf|ttf|woff|woff2]`

Will be created from `Session.defaultProviders` if parameter `fontsDir` is passed in session params.
Also can use `fontsDirCache` for specify cache duration.

```javascript
import DirProvider from 'svg-text-to-path/providers/dir/DirProvider.js';
```

- `constructor(dir[, cache = 0])`;
    - `dir {String}` - directory path;
    - `cache {Number}` - time to cache;

### HttpProvider

Makes a request for a list of available families and variants.

If repository url contains `--family--` substring, then the provider will make request for each family.
Response must be dictionary of font source object (see ConfigProvider), or array of source object
(if `--family--` substring used).

Will be created from `Session.defaultProviders` if parameter `fontsUrl` is passed in session params.
Also can use `fontsUrlCache` for specify cache duration.

```javascript
import HttpProvider from 'svg-text-to-path/providers/http/HttpProvider.js';
```

- `constructor(repoUrl[, cache])`;
    - `repoUrl {String}` - repository url;
    - `cache {Number}` - time to cache (default cache - 600000ms);

### GoogleProvider

Find font in Google Fonts repository. You must provide API key in `googleApiKey`.

For information on how to get the API key, see https://developers.google.com/fonts/docs/developer_api .

Note: Google Fonts API does not currently support variable fonts.

Will be created from `Session.defaultProviders` if parameter `googleApiKey` is passed in session params.
Also can use `googleCache` for specify cache duration.

```javascript
import GoogleProvider from 'svg-text-to-path/providers/google/GoogleProvider.js';
```

- `constructor(apiKey[, cache])`;
    - `apiKey {String}` - google fonts api key;
    - `cache {Number}` - time to cache (default cache - 600000ms);
