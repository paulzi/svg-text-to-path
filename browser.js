import { load } from 'opentype.js';
import { shims } from './src/shims.js';
import { replaceAll, svgToString } from './src/main.js';
import mapHandler from './handlers/map.js';
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
    const parser = new DOMParser();
    const node = parser.parseFromString(svg, 'image/svg+xml').documentElement;
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
    let doc = element.ownerDocument;
    let div;
    if (!doc.defaultView) {
        div = document.createElement('div');
        div.style.display = 'none';
        document.body.appendChild(div);
        div.appendChild(doc.documentElement);
    }
    try {
        await replaceAll(element, params);
    } finally {
        if (div) {
            doc.appendChild(div.firstChild);
            div.parentElement.removeChild(div);
        }
    }
    return svgToString(element);
}

/**
 * Get Font instance by path
 * @param {String} path
 * @returns {Promise<import('opentype.js').Font>}
 */
async function getFontInternal(path) {
    return await load(path);
}

/**
 * Get family list for svg node
 * @param {SVGElement} node 
 * @param {CSSStyleDeclaration} style 
 */
function getStyleProp(node, style, prop) {
    return style[prop];
}

/**
 * Get XMLSerializer instance
 * @param {SVGSVGElement} svgNode
 * @returns {XMLSerializer}
 */
function makeSerializer(svgNode) {
    let win = svgNode.ownerDocument.defaultView || window;
    return new win.XMLSerializer();
}

shims.defaultHandlers = [mapHandler];
shims.fetch           = (...args) => window.fetch(...args);
shims.getFontInternal = getFontInternal;
shims.getStyleProp    = getStyleProp;
shims.makeSerializer  = makeSerializer;