/**
 * Shims container
 */
export const shims = {};

/**
 * Get default handlers
 * @returns {Function[]}
 */
export function getDefaultHandlers() {
    return shims.defaultHandlers;
}

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
 * Get Font instance by path
 * @param {String} path
 * @returns {Promise<import('opentype.js').Font>}
 */
export async function getFontInternal(path) {
    return await shims.getFontInternal(path);
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