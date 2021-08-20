import { resolve } from 'path';
import { cwd } from 'process';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import { load, parse } from 'opentype.js';
import { replaceAll } from './src/main.js';
import mapHandler from './handlers/map.js';
import dirHandler from './handlers/dir.js';
import internal from './src/internal.js';
export {
    getFont,
    setFont,
    getFontForNode,
    getPaths,
    getPath,
    replace,
    replaceAll,
} from './src/main.js';

/**
 * Get SVG DOM Element from string
 * @param {String} svg 
 * @return {SVGSVGElement}
 */
export function getSvgElement(svg) {
    const dom = new JSDOM('<html><body></body></html>'); // todo check empty
    const document = dom.window.document;
    const parser = new dom.window.DOMParser();
    const node = parser.parseFromString(svg, 'image/svg+xml').documentElement;
    document.body.appendChild(node);
    node.querySelectorAll('style').forEach(style => {
        document.head.insertAdjacentHTML('beforeend', style.outerHTML);
    });
    return node;
}

/**
 * Replace svg <text> nodes in string svg with <path> nodes
 * @param {String} svg
 * @param {Object} params
 * @return {String}
 */
export async function replaceAllInString(svg, params = {}) {
    let element = getSvgElement(svg);
    await replaceAll(element, params);
    return element.outerHTML;
}


/**
 * Get Font instance by path
 * @param {Object} style
 * @param {String} style.family
 * @param {Number} style.wght
 * @param {Number} style.ital
 * @returns {import('opentype.js').Font}
 */
async function getFontInternal(path) {
    if (path && typeof path === 'object') {
        return path;
    }
    if (path.indexOf(':') !== -1) {
        let response = await fetch(path);
        let buffer = await response.arrayBuffer();
        return parse(buffer);
    } else {
        if (path.slice(0, 1) !== '/') {
            path = resolve(cwd(), path);
        }
        return await load(path);
    }
}

internal.getFontInternal = getFontInternal;
internal.fetch = fetch;
internal.handlers = [mapHandler, dirHandler];