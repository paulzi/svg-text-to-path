import { resolve } from 'path';
import { cwd } from 'process';
import { readFile } from 'fs/promises';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import { getNodeStyle } from '../misc.js';

export {fetch};

/**
 * @param {String} source
 * @param {Promise<ArrayBuffer>}
 */
export async function getBufferFromSource(source) {
    if (source.indexOf(':') !== -1) {
        let response = await fetch(source);
        return await response.arrayBuffer();
    }
    if (source.slice(0, 1) !== '/') {
        source = resolve(cwd(), source);
    }
    return readFile(source);
};

/**
 * @param {String} str 
 * @param {Boolean} [loadResources] 
 * @returns {SVGSVGElement}
 */
export function parseSvgString(str, loadResources) {
    let jsdomParams = {};
    if (loadResources) {
        jsdomParams.resources = 'usable';
    }
    const dom = new JSDOM('<html><body></body></html>', jsdomParams);
    const document = dom.window.document;
    const parser = new dom.window.DOMParser();
    const node = parser.parseFromString(str, 'image/svg+xml').documentElement;
    document.body.appendChild(node);
    node.querySelectorAll('style').forEach(style => {
        document.head.insertAdjacentHTML('beforeend', style.outerHTML);
    });
    if (loadResources) {
        node._svgTextToPathPromise = new Promise(resolve => {
            document.onload = resolve;
        });   
    }
    return node;
}

/**
 * JSDOM getComputedStyle not inherit for svg nodes, and normalize font-size units
 * @param {SVGElement} node 
 * @param {CSSStyleDeclaration} style 
 * @param {String} prop
 * @return {String}
 */
export function getStyleProp(node, style, prop) {
    let isFontSize = prop === 'fontSize';
    let cur = node;
    let factor = 1;
    let rootFactor;
    let svgRoot = node.ownerDocument.body.querySelector('svg');
    let afterRoot = false;
    do {
        afterRoot = afterRoot || cur === svgRoot;
        let result = style[prop];
        let isAttr = false;
        if (!result && ['text', 'tspan'].includes(cur.nodeName)) {
            let attr = prop.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
            result = cur.getAttributeNS(null, attr);
            isAttr = true;
        }
        if (result && isFontSize) {
            result = normalizeFontSize(result, isAttr);
            if (Array.isArray(result)) {
                if (result[1] && !afterRoot) {
                    factor = 1;
                    rootFactor = result[0];
                    cur = svgRoot;
                } else {
                    factor *= result[0];
                }
                result = null;
            }
        }
        if (result && prop === 'letterSpacing') {
            result = normalizeFontSize(result, isAttr);
            if (Array.isArray(result)) {
                let fontSize;
                if (result[1]) {
                    fontSize = getStyleProp(svgRoot, getNodeStyle(svgRoot), 'fontSize');
                } else {
                    fontSize = getStyleProp(node, style, 'fontSize');
                }
                result = parseFloat(fontSize) * result[0] + 'px';
            }
        }
        if (result) {
            if (isFontSize) {
                return result * factor + 'px';
            }
            return result;
        }
        cur = cur.parentNode;
        if (cur && cur.ownerDocument === null) {
            cur = null;
        }
        style = cur ? getNodeStyle(cur) : null;
    } while (cur);
    if (isFontSize) {
        return 16 * factor * (rootFactor || 1) + 'px';
    }
}

/**
 * JSDOM SVGLength polyfill
 * @param {SVGTextElement|SVGTSpanElement} node
 * @returns {Number[]}
 */
export function parseSvgLength(node, prop) {
    let value = node.getAttributeNS(null, prop);
    if (value === null) {
        return [];
    }
    value = value.trim().split(/[\s,]+/);
    let viewBox, style;
    let result = [];
    for (let str of value) {
        let match = str.trim().match(/^([\d.-]+)(.*)$/);
        if (!match) {
            return [];
        }
        let [, val, dim] = match;
        val = parseFloat(val);
        // @see https://developer.mozilla.org/en-US/docs/Web/API/SVGLength
        switch (dim) {
            case '':
            case 'px':
                break;
            case '%':
                viewBox = viewBox || node.ownerSVGElement.getAttributeNS(null, 'viewBox').split(' ').map(parseFloat);
                val = val * (viewBox[prop === 'y' || prop === 'dy' ? 3 : 2] || 0) / 100;
                break;
            case 'em':
            case 'ex':
                // 1ex ≈ 0.5em
                // @see https://developer.mozilla.org/en-US/docs/Web/CSS/length
                style = style || getNodeStyle(node);
                let fontSize = parseFloat(getStyleProp(node, style, 'fontSize'));
                val = val * fontSize * (dim === 'ex' ? 0.5 : 1);
                break;
            case 'in':
                val *= 96;
                break;
            case 'mm':
                val *= 96 / 25.4;
                break;
            case 'cm':
                val *= 96 / 2.54;
                break;
            case 'pt':
                val *= 4 / 3;
                break;
            case 'pc':
                val *= 16;
                break;
            default:
                return [];
        }
        result.push(val);
    }
    return result;
}

/**
 * @param {String} value 
 * @param {Boolean} isAttr 
 * @returns {Number|Number[]|null}
 */
function normalizeFontSize(value, isAttr) {
    let match = value.trim().match(/^([\d.-]+)(.*)$/);
    if (!match) {
        return null;
    }
    let [, val, dim] = match;
    val = parseFloat(val);
    switch (dim) {
        case '':
            return isAttr ? val : null;
        case 'px':
            return val;
        case '%':
            return [val / 100];
        case 'rem':
            return [val, true];
        case 'em':
        case 'ex':
            // 1ex ≈ 0.5em
            // @see https://developer.mozilla.org/en-US/docs/Web/CSS/length
            return [val / (dim === 'ex' ? 2 : 1)]
        // todo ch
        case 'in':
            return val * 96;
        case 'mm':
            return val * 96 / 25.4;
        case 'cm':
            return val * 96 / 2.54;
        case 'pt':
            return val * 4 / 3;
        case 'pc':
            return val * 16;
        default:
            return null;
    }
}