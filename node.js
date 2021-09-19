import { resolve } from 'path';
import { cwd } from 'process';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import { load, parse } from 'opentype.js';
import { shims } from './src/shims.js';
import { replaceAll, svgToString } from './src/main.js';
import { getNodeStyle } from './src/misc.js';
import mapHandler from './handlers/map.js';
import dirHandler from './handlers/dir.js';
export { convertTSpanText } from './src/tspan.js';
export {
    getFont,
    setFont,
    getFontForNode,
    getPaths,
    getPath,
    replace,
    replaceAll,
    svgToString,
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
 * @param {Object} [params]
 * @return {Promise<String>}
 */
export async function replaceAllInString(svg, params = {}) {
    let element = getSvgElement(svg);
    await replaceAll(element, params);
    return svgToString(element);
}

/**
 * Get Font instance by path
 * @param {String} path
 * @returns {Promise<import('opentype.js').Font>}
 */
async function getFontInternal(path) {
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

/**
 * Get family list for svg node
 * @param {SVGElement} node 
 * @param {CSSStyleDeclaration} style 
 * @param {String} prop
 */
function getStyleProp(node, style, prop) {
    // JSDOM getComputedStyle not inherit for svg nodes
    do {
        let result = style[prop];
        if (result) {
            return result;
        }
        node = node.parentNode;
        if (node && node.ownerDocument === null) {
            node = null;
        }
        style = node ? getNodeStyle(node) : null;
    } while (node);
}

shims.defaultHandlers = [mapHandler, dirHandler];
shims.fetch           = fetch;
shims.getFontInternal = getFontInternal;
shims.getStyleProp    = getStyleProp;