export const shims = {};

/**
 * Fetch API shims (node/browser)
 * @param {RequestInfo} input
 * @param {RequestInit} [init]
 * @returns {Promise<Response>}
 */
export function fetch(input, init) {
    return shims.fetch(input, init);
}

/**
 * @param {String} source
 * @param {Promise<ArrayBuffer>}
 */
export function getBufferFromSource(source) {
    return shims.getBufferFromSource(source);
}

/**
 * Get family list for svg node
 * @param {SVGElement} node 
 * @param {CSSStyleDeclaration} style 
 * @param {String} prop
 */
export function getStyleProp(node, style, prop) {
    return shims.getStyleProp(node, style, prop);
}

/**
 * @param {String} str 
 * @param {Boolean} [loadResources]
 * @returns {SVGSVGElement}
 */
export function parseSvgString(str, loadResources) {
    return shims.parseSvgString(str, loadResources);
}

/**
 * @param {SVGTextElement|SVGTSpanElement} node
 * @returns {Number[]}
 */
export function parseSvgLength(node, prop) {
    return shims.parseSvgLength(node, prop);
}