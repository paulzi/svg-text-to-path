#!/usr/bin/env node
import minimist from 'minimist';
import { readFileSync, writeFileSync, fsyncSync } from 'fs';
import { exit, stdout, stdin, stderr } from 'process';
import Session from '../entries/node.js';

let args = minimist(process.argv.slice(2));
if (args.help || (process.argv.length === 2 && stdin.isTTY)) {
    stdout.write(`Usage: svg-text-to-path [options] [input file]

Options:
  -o, --output              output file, if no file is specified and no pipes are used, the input file will be replaced
  -c, --config              path to config file (in JSON format, keys in camel case)
  -t, --load-resources      load external resources like <link>
  -p, --use-font-face       parse @font-face css rules to find paths to fonts
  -d, --fonts-dir           path to fonts dir, dir structure variants:
                            static fonts:   ./[family]/[wght][?i].[otf|ttf|woff|woff2]
                            variable fonts: ./[family]/[axis],[from][?..to];[axis],[from][?..to].[otf|ttf|woff|woff2]
                            default: './fonts'
  -u, --fonts-url           font repository URL, two options are possible:
                            1) if placeholder "--family--" is present, then the repository will be loaded for each
                            family, web service should return an array of font source objects (see below)
                            2) otherwise, one request is used, in response must be a dictionary of array of font source
  -g, --google-api-key      if specified, Google Fonts repository is used
                            note: Google Fonts API does not currently support variable fonts
  -q, --selector            css selector for find and replace <text> nodes (default: 'text')
  -s, --split               split each glyph in separate path
  -e, --decimals            decimal places in <path> coordinates (default: 2)
  -a, --text-attr           save text content to attribute
  -k, --keep-font-attrs     keep font representation attributes (font-size, letter-spacing, ...)
  -f, --family-classes      list of font categories
                            example: sans-serif:Arial,Tahoma;sans:Times New Roman
  -m, --fallback-families   list of fallback families
                            example: Arial,Times New Roman
  -x, --fallback-glyph      if no glyphs are found for a character, using family and codepoint of char for replace
                            example: Arial,32
  -n, --no-font-action      if the font for the char is not found, and fallback glyph is not set:
                            'skipNode' - skip this <text> node
                            'error' - stop processing file and throw error
                            another values - skip char
  -j, --stat                save statistics to json file
                            if key exist, but file is not specified, statistics will be sent to standard output

In config file you can specify "fonts" key with dictionary of array of font source:
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
`);
    exit(2);
}

try {
    let input            = args._[0];
    let output           = args.o || args['output']            || null;
    let config           = args.c || args['config']            || null;
    let loadResources    = args.t || args['load-resources']    || null;
    let useFontFace      = args.p || args['use-font-face']     || null; 
    let fontsDir         = args.d || args['fonts-dir']         || './fonts'; 
    let fontsUrl         = args.u || args['fonts-url']         || null;
    let selector         = args.q || args['selector']          || 'text';
    let split            = args.s || args['split']             || null;
    let decimals         = args.e || args['decimals']          || null;
    let googleApiKey     = args.g || args['google-api-key']    || null;
    let textAttr         = args.a || args['text-attr']         || null;
    let keepFontAttrs    = args.k || args['keep-font-attrs']   || null;
    let familyClasses    = args.f || args['family-classes']    || null;
    let fallbackFamilies = args.m || args['fallback-families'] || null;
    let fallbackGlyph    = args.x || args['fallback-glyph']    || null;
    let noFontAction     = args.n || args['no-font-action']    || null;
    let jsonStat         = args.j || args['stat']              || null;

    let params = {
        loadResources,
        useFontFace,
        useFontFaceAjax: true,
        fontsDir,
        fontsUrl,
        googleApiKey,
        selector,
        split,
        decimals,
        textAttr,
        keepFontAttrs,
        familyClasses: parseFamilyClasses(familyClasses),
        fallbackFamilies: fallbackFamilies ? fallbackFamilies.split(',') : null,
        fallbackGlyph: parseFallbackGlyph(fallbackGlyph),
        noFontAction,
    };
    params = Object.entries(params).filter(([key, value]) => value !== null);
    params = Object.fromEntries(params);

    if (config) {
        config = JSON.parse(readFileSync(config));
        params = Object.assign(config, params);
    }

    let content = readFileSync(stdin.isTTY ? input : stdin.fd, {encoding: 'utf-8'});
    let session = new Session(content, params);
    let stat = await session.replaceAll(selector);
    let outToFile = output || stdout.isTTY;
    writeFileSync(outToFile ? output || input : stdout.fd, session.getSvgString());
    if (jsonStat !== null && jsonStat !== true) {
        writeFileSync(jsonStat, JSON.stringify(stat));
    }
    if (outToFile) {
        if (jsonStat === true) {
            stdout.write(JSON.stringify(stat) + "\n");
        } else {
            printStat(stat);
        }
    } else {
        fsyncSync(stdout.fd);
        fsyncSync(stderr.fd);
    }
    exit(0);
} catch (e) {
    stderr.write(`ERROR: ${e.message}\n`);
    exit(1);
}

/**
 * @param {String} input 
 * @return {?Object.<String, String[]>}
 */
function parseFamilyClasses(input) {
    if (!input) {
        return null;
    }
    return input.split(';').reduce((acc, item) => {
        let [cls, families] = item.split(':');
        families = families.split(',');
        if (cls && families.length) {
            acc[cls] = families;
        }
        return acc;
    }, {});
}

/**
 * 
 * @param {String} input 
 * @returns {?Array}
 */
function parseFallbackGlyph(input) {
    if (!input) {
        return null;
    }
    let [family, codepoint] = input.split(',');
    if (family && codepoint) {
        return [family, parseInt(codepoint)];
    }
    return null;
}

/**
 * @param {Array} data
 * @param {String} prop
 * @returns {Object.<String, *>}
 */
function groupBy(data, prop) {
    let result = {};
    data.forEach(item => {
        let key = item[prop];
        result[key] = result[key] || [];
        result[key].push(item);
    });
    return result;
}

/**
 * @param {import('../src/Session.js').SessionStat} stat
 */
function printStat(stat) {
    if (stat.used.length) {
        stdout.write(`Used fonts:\n`);
        let used = groupBy(stat.used, 'family');
        Object.entries(used).forEach(([family, variants]) => {
            let chars = variants.reduce((acc, variant) => acc + variant.chars, 0);
            stdout.write(`  '${family}': ${variants.length} variants, ${chars} chars\n`);
        });
    }
    if (stat.skipped > 0) {
        stdout.write(`Skipped chars: ${stat.skipped}\n`);
    }
    if (stat.missed.length) {
        stdout.write(`Missed families: ${stat.missed.map(family => `'${family}'`).join(', ')}\n`);
    }
    if (stat.warnings.length) {
        stdout.write(`Warnings:\n`);
        let warnings = groupBy(stat.warnings, 'family');
        Object.entries(warnings).forEach(([family, items]) => {
            items.forEach(({axes, variant}) => {
                stdout.write(`  '${family}': ${warningToString(axes, variant)}\n`);
            });
        });
    }
    if (stat.errors.length) {
        stdout.write(`Errors:\n`);
        let errors = groupBy(stat.errors, 'family');
        Object.entries(errors).forEach(([family, items]) => {
            items.forEach(({variant}) => {
                stdout.write(`  '${family}' (${variantToString(variant)}): '${variant.source}'\n`);
            });
        });
    }
    stdout.write(`Successfuly replaced ${stat.replaced} of ${stat.total} text nodes\n`);
}

/**
 * @param {Object} axes 
 * @param {Object} variant 
 * @returns {String}
 */
function warningToString(axes, variant) {
    let list = {
        wdth: 400,
        ital: 0,
        wght: 100,
        slnt: 0
    };
    let aList = [];
    let vList = [];
    for (let [axis, def] of Object.entries(list)) {
        let aVal = axes[axis]    ?? def;
        let vVal = variant[axis] ?? def;
        vVal = Array.isArray(vVal) ? vVal : [vVal, vVal];
        if (aVal !== def || aVal < vVal[0] || aVal > vVal[1]) {
            aList.push(`${axis}=${aVal}`);
        }
        if (vVal[0] !== def || vVal[1] !== def || aVal < vVal[0] || aVal > vVal[1]) {
            if (vVal[1] > vVal[0]) {
                vList.push(`${axis}=${vVal[0]}..${vVal[1]}`);
            } else {
                vList.push(`${axis}=${vVal[0]}`);
            }
        }
    }
    return `${aList.join(',')} >> ${vList.join(',')}`;
}

/**
 * @param {Object} variant 
 * @returns {String}
 */
function variantToString(variant) {
    return ['wght', 'ital', 'wdth', 'slnt']
        .map(axis => {
            let val = variant[axis];
            if (val === undefined) {
                return null;
            }
            if (Array.isArray(val)) {
                return `${axis}=${val[0]}..${val[1]}`;
            }
            return `${axis}=${val}`;
        })
        .filter(v => v)
        .join(',');

}
