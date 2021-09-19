/**
 * Return string representation of font style
 * @param {Object} style
 * @param {String} style.family
 * @param {Number} style.wght
 * @param {Number} style.ital
 * @returns {String}
 */
export function getFontMod(style) {
    return [style.wgth || 400, style.ital ? 'i' : ''].join('');
}

/**
 * Copy all attributes
 * @param {SVGElement} source
 * @param {SVGElement} target
 * @param {String[]} [except]
 */
export function copyAttributes(source, target, except) {
    for (let i = 0, len = source.attributes.length; i < len; i++) {
        let node = source.attributes[i];
        if (!except || except.indexOf(node.name) === -1) {
            target.setAttribute(node.name, node.value);
        }
    }
}

/**
 * Get computed style of node
 * @param {SVGElement} node
 * @returns {CSSStyleDeclaration}
 */
export function getNodeStyle(node) {
    const document = node.ownerDocument;
    const getComputedStyle = document.defaultView.getComputedStyle;
    return getComputedStyle(node);
}

/**
 * Create element from another
 * @param {String} tag 
 * @param {SVGElement} node 
 */
export function createElementFrom(tag, node) {
    const document = node.ownerDocument;
    return document.createElementNS(node.namespaceURI, tag);
}
