import { load } from 'opentype.js';
import mapHandler from './handlers/map.js';
import internal from './src/internal.js';
import { replaceAll } from './src/main.js';
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
    const parser = new DOMParser();
    const node = parser.parseFromString(svg, 'image/svg+xml').documentElement;
    return node;
}

/**
 * Replace svg <text> nodes in string svg with <path> nodes
 * @param {String} svg
 * @param {Object} [params]
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
    return await load(path);
}

internal.getFontInternal = getFontInternal;
internal.fetch = function(...args) {
    return window.fetch(...args);
};
internal.handlers = [mapHandler];