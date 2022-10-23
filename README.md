
# Svg text to path

[![NPM version](http://img.shields.io/npm/v/svg-text-to-path.svg?style=flat)](https://www.npmjs.org/package/svg-text-to-path)
[![Downloads](https://img.shields.io/npm/dt/svg-text-to-path.svg)](https://www.npmjs.org/package/svg-text-to-path)
![License](https://img.shields.io/npm/l/svg-text-to-path.svg)

Convert svg <text> nodes to vector font-free <path> elements.

Features:

- supports `<tspan>`;
- supports multiple values of attributes `x`, `y`, `dx`, `dy`;
- supports CSS `text-anchor` and `dominant-baseline` properties;
- supports `textLength` and `lengthAdjust`;
- supports css units (em, rem, %, mm, cm, in, pt, pc, ...);
- supports variable fonts (include custom axis via `font-variation-settings`);
- supports open type features via css `font-feature-settings` (`liga`, `smcp` and another)
- supports otf/ttf/woff/woff2 fonts;
- integrated with Google Fonts;
- supports various font sources: config, `@font-face`, directory, http-repository or your own handler;
- supports nodejs and browser runtime;
- detailed statistics.

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

You can see the list of options by typing:

```bash
svg-text-to-path --help
```

### Code

Import required class from library:

```javascript
import Session from 'svg-text-to-path';

let session = new Session(svg, {
  googleApiKey: '...',
});
let stat = await session.replaceAll();
let out  = session.getSvgString();
```

Or include `dist/svg-text-to-path-fontkit.js` and use `window.SvgTextToPath` object:

```javascript
let session = new SvgTextToPath(document.querySelector('svg'), {
  googleApiKey: '...',
});
let stat = await session.replaceAll();
```

### Server

Start server:

```bash
svg-text-to-path-server [configFile]
```

Config file is the same as for the cli.

Post svg-file to `http://{host}:{port}/?params`, get processed svg in response body.
Statistics in `X-Svg-Text-To-Path` header (if `stat` parameter enabled).
Default port: 10000.

Curl example:

```bash
curl --header "Content-Type: image/svg+xml" \
  --request POST \
  --data-binary "@input.svg" \
  http://localhost:10000/?googleApiKey=...&stat=1
```


## Documentation

[Read full documentation](https://github.com/paulzi/svg-text-to-path/blob/master/documentation.md)

## Donation

Send me a donation for project development:

https://pay.cloudtips.ru/p/0b408436