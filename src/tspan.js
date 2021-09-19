import { getStyleProp } from './shims.js';
import { getFontForNode } from './main.js';
import { copyAttributes, getNodeStyle, createElementFrom } from './misc.js';

/**
 * Process tspan x/y/dx/dy attributes
 * @param {SVGTSpanElement} tspan 
 * @param {Object} glob 
 */
function processCoord(tspan, glob) {
    let style;
    let getStyle = () => style || getNodeStyle(tspan);
    ['x', 'y', 'dx', 'dy'].forEach(prop => {
        let value = tspan.getAttributeNS(null, prop);
        if (value === null && (tspan.nodeName !== 'text' || (prop !== 'x' && prop !== 'y'))) {
            return;
        }
        let factor = 1;
        if (value !== null && value.slice(-2) === 'em') {
            factor = parseFloat(getStyleProp(tspan, getStyle(), 'fontSize'));
        }
        value = factor * (parseFloat(value) || 0);
        if (prop.length === 2) {
            glob[prop.slice(1)] += value;
        } else {
            processRow(glob);
            glob.row    = [];
            glob.anchor = getStyleProp(tspan, getStyle(), 'textAnchor');
            glob[prop]  = value;
            glob.width  = glob.x || 0;
        }
    });
}

/**
 * Process text tspan row
 * @param {Object} glob 
 */
function processRow(glob) {
    let w = glob.x - glob.width;
    glob.row && glob.row.forEach(text => {
        let diff = null;
        switch (glob.anchor) {
            case 'middle':
                diff = w / 2;
                break;
            case 'end':
                diff = w;
                break;
        }
        if (diff !== null) {
            let x = parseFloat(text.getAttributeNS(null, 'x')) || 0;
            text.setAttributeNS(null, 'x', x - diff);
            text.style.textAnchor = 'start';
        }
    });
}

/**
 * Convert recoursive all <tspan> to <text>
 * @param {SVGElement} node
 * @param {Object} params
 * @param {Object} glob
 * @param {Object} local 
 * @returns {Promise<SVGElement>}
 */
async function processTSpan(node, params, glob, local) {
    if (node.nodeType === 3) { // Node.TEXT_NODE
        let parent = node.parentNode;
        let content = node.nodeValue;
        let text = createElementFrom('text', parent);
        text.innerHTML = content;
        text.setAttributeNS(null, 'x', glob.x);
        text.setAttributeNS(null, 'y', glob.y);
        if (local.style === undefined) {
            let {font, style} = await getFontForNode(parent, params);
            local.font  = font;
            local.style = style;
        }
        if (local.font) {
            let size = getStyleProp(parent, local.style, 'fontSize');
            glob.x += local.font.getAdvanceWidth(content, parseFloat(size), params);
            glob.row.push(text);
        }
        return text;
    } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
        if (['tspan', 'text'].indexOf(node.nodeName) === -1) {
            return node;
        }
        processCoord(node, glob);
        let g = createElementFrom('g', node);
        copyAttributes(node, g, ['x', 'y', 'dx', 'dy']);
        let childs = Array.prototype.slice.call(node.childNodes);
        for (let child of childs) {
            let processed = await processTSpan(child, params, glob, {});
            g.appendChild(processed);
        }
        if (node.nodeName === 'text') {
            processRow(glob);
        }
        return g;
    } else {
        return node;
    }
}

/**
 * Convert <text> with <tspan> to <g> with multiple <text>
 * @param {SVGTextElement} textNode
 * @param {Object} [params]
 * @returns {Promise<SVGGElement>}
 */
export async function convertTSpanText(textNode, params = {}) {
    return await processTSpan(textNode, params, {}, {});
}