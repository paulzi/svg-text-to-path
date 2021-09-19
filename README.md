
# Svg text to path

[![NPM version](http://img.shields.io/npm/v/svg-text-to-path.svg?style=flat)](https://www.npmjs.org/package/svg-text-to-path)
[![Downloads](https://img.shields.io/npm/dt/svg-text-to-path.svg)](https://www.npmjs.org/package/svg-text-to-path)
![License](https://img.shields.io/npm/l/svg-text-to-path.svg)

Convert svg <text> nodes to vector font-free <path> elements.

Features:

- support otf/ttf fonts;
- integrated with Google Fonts;
- support `<tspan>`;
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
  -r, --group           use group <g> tag for each text (ignored if merged)
  -p, --decimals        decimal places in <path> coordinates
  -t, --strict          stop process with error on missed fonts
  -z, --default-font    font for replace missed fonts (format: "family:wght:ital")
  -k, --kerning         enable kerning (default: true)
  -h, --hinting         enable hinting (default: false)
  -f, --features        comma separated list og opentype font features (liga, rlig)
  -l, --letter-spacing  letter spacing value
  -g, --google-api-key  google api key for using Google Fonts
  -a, --text-attr       save text content in attribute

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

### Server

Start server:

```bash
svg-text-to-path-server [configFile]
```

Config file is the same as for the cli.

Post svg-file to `http://{host}:{port}/?params`, get processed svg in response body. Default port: 10000.

Curl example:

```bash
curl --header "Content-Type: image/svg+xml" \
  --request POST \
  --data-binary "@input.svg" \
  http://localhost:10000/?googleApiKey=<key>&group=1
```


## Documentation

[Read documentation](https://github.com/paulzi/svg-text-to-path/blob/master/documentation.md)

## Browser support

All modern browsers (IE RIP).
Nodejs