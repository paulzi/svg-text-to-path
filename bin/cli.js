#!/usr/bin/env node
import minimist from 'minimist';
import { readFileSync, writeFileSync, fsyncSync } from 'fs';
import { exit, stdout, stdin, stderr } from 'process';
import { getSvgElement, replaceAll } from '../node.js';
import mapHandler from '../handlers/map.js';
import dirHandler from '../handlers/dir.js';
import httpHandler from '../handlers/http.js';
import googleHandler from '../handlers/google.js';

let args = minimist(process.argv.slice(2));
if (args.help || (process.argv.length === 2 && stdin.isTTY)) {
    stdout.write(`Usage: svg-text-to-path [options] [input file]

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
`);
    exit(2);
}

try {
    let input         = args._[0];
    let output        = args.o || args['output']         || null;
    let config        = args.c || args['config']         || null;
    let fontsDir      = args.d || args['fonts-dir']      || './fonts'; 
    let fontsUrl      = args.u || args['fonts-url']      || null;
    let selector      = args.s || args['selector']       || null;
    let merged        = args.m || args['merged']         || null;
    let decimals      = args.p || args['decimals']       || null;
    let strict        = args.t || args['strict']         || null;
    let defaultFont   = args.z || args['default-font']   || null;
    let kerning       = args.k || args['kerning']        || null;
    let hinting       = args.h || args['hinting']        || null;
    let features      = args.f || args['features']       || null;
    let letterSpacing = args.l || args['letter-spacing'] || null;
    let googleApiKey  = args.g || args['google-api-key'] || null;

    let params = {
        fontsDir,
        fontsUrl,
        googleApiKey,
        selector,
        merged,
        decimals,
        onFontNotFound: strict ? 'error' : null,
        defaultFont: parseFont(defaultFont),
        kerning,
        hinting,
        features: parseFeatures(features),
        letterSpacing,
    };
    params = Object.entries(params).filter(([key, value]) => value !== null);
    params = Object.fromEntries(params);

    if (config) {
        config = JSON.parse(readFileSync(config));
        params = Object.assign(config, params);
    }

    params.onFontNotFound = params.strict ? 'error' : (textNode, familyList, wght, ital) => {
        stderr.write(`Font ${familyList.join(', ')} (wght: ${wght}, ital: ${ital}) not found\n`);
    };

    let handlers = [mapHandler, dirHandler];
    if (params.googleApiKey) {
        handlers.push(googleHandler);
    }
    handlers.push(httpHandler);
    params.handlers = handlers;

    let content = readFileSync(stdin.isTTY ? input : stdin.fd);
    let element = getSvgElement(content);
    let stat = await replaceAll(element, params);
    let outToFile = output || stdout.isTTY;
    writeFileSync(outToFile ? output || input : stdout.fd, element.outerHTML);
    if (outToFile) {
        stdout.write(`Successfuly replaced ${stat.success} of ${stat.total} text nodes\n`);
    } else {
        fsyncSync(stdout.fd);
        fsyncSync(stderr.fd);
    }
    exit(0);
} catch (e) {
    stdout.write(`ERROR: ${e.message}\n`);
    exit(1);
}

/**
 * @param {Syting} value
 * @returns {Object}
 */
function parseFont(value) {
    if (!value) {
        return null;
    }
    let [family, wdth = 400, ital = 1] = value.split(':', 3);
    wdth = parseInt(wdth) || 400;
    ital = parseInt(ital) || 0;
    return {family, wdth, ital};
}

/**
 * @param {Syting} value
 * @returns {Object}
 */
function parseFeatures(value) {
    if (!value) {
        return null;
    }
    return value.split(',').reduce((acc, cur) => {
        acc[cur.trim] = true;
    }, {});
}
