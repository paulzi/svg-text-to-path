/**
 * @param  {...any} args 
 * @returns {Promise<Response>}
 */
export function fetch(...args) {
    return window.fetch(...args);
}

/**
 * @param {String} source
 * @param {Promise<Buffer>}
 */
export async function getBufferFromSource(source) {
    let response = await fetch(source);
    return await response.arrayBuffer();
}

/**
 * @param {String} str 
 * @returns {SVGSVGElement}
 */
export function parseSvgString(str) {
    const parser = new DOMParser();
    const node = parser.parseFromString(str, 'image/svg+xml').documentElement;
    const div = document.createElement('div');
    div.style.display = 'none';
    div.appendChild(node);
    document.body.appendChild(div);
    return node;
}

/**
 * @param {SVGElement} node 
 * @param {CSSStyleDeclaration} style 
 */
export function getStyleProp(node, style, prop) {
    return style[prop];
}

/**
 * @param {SVGTextElement|SVGTSpanElement} node
 * @returns {Number[]}
 */
export function parseSvgLength(node, prop) {
    let list = node[prop].baseVal;
    list = list.length !== undefined ? list : [list];
    return Array.prototype.map.call(list, item => item.value);
}