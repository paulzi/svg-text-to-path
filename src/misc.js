/**
 * Copy all attributes from one node to another
 * @param {SVGElement} source
 * @param {SVGElement} target
 * @param {String[]} [except]
 */
export function copyAttributes(source, target, except) {
    for (let i = 0, len = source.attributes.length; i < len; i++) {
        let node = source.attributes[i];
        let attr = node.name;
        let pass = true;
        for (let item of except || []) {
            if (item === attr || (item.test && item.test(attr))) {
                pass = false;
                break;
            }
        }
        pass && target.setAttribute(attr, node.value);
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
 * Create element from another element
 * @param {String} tag
 * @param {SVGElement} node
 */
export function createElementFrom(tag, node) {
    const document = node.ownerDocument;
    return document.createElementNS(node.namespaceURI, tag);
}

/**
 * Apply map of promise to promise result
 * @param {Map<*, Promise>} map 
 */
export async function applyPromiseMap(map) {
    await Promise.all(map.values());
    for (let [key, promise] of map.entries()) {
        map.set(key, await promise);
    }
}