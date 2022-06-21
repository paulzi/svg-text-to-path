import { getDefaultHandlers, getFontInternal, getStyleProp, makeSerializer } from './shims.js';
import { copyAttributes, getNodeStyle, createElementFrom } from './misc.js';
import { convertTSpanText } from './tspan.js';

// CSS font-weight to wght map
const wghtMap = {
    'normal': 400,
    'bold':   700,
};

// CSS font-style to ital map
const italMap = {
    'italic': 1,
    'normal': 0,
};

// font cache
let fonts = new Map();

/**
 * Get Font instance for font style
 * @param {Object} style
 * @param {String} style.family
 * @param {Number} style.wght
 * @param {Number} style.ital
 * @param {Object} [params]
 * @param {Function[]} [params.handlers]
 * @returns {Promise<import('opentype.js').Font>}
 */
export async function getFont(style, params = {}) {
    let key = getFontKey(style);
    let font = fonts.get(key);
    if (font instanceof Promise) {
        return await font;
    }
    if (font) {
        return font;
    }
    let promise = loadFont(style, params)
        .then(font => {
            fonts.set(key, font);
            return font;
        });
    fonts.set(key, promise);
    return await promise;
}

/**
 * Set Font for style
 * @param {Object} style
 * @param {String} style.family
 * @param {Number} style.wght
 * @param {Number} style.ital
 * @param {import('opentype.js').Font} font 
 */
export function setFont(style, font) {
    fonts.set(getFontKey(style), font);
}

/**
 * Get opentype.js Font instance for svg <text> or <tspan> node
 * @param {SVGTextElement|SVGTSpanElement} textNode 
 * @param {Object} [params]
 * @param {String|Function} [params.onFontNotFound]
 * @param {Object} [params.defaultFont]
 * @returns {Promise<{font: null|import('opentype.js').Font, fontStyle: Object, style: CSSStyleDeclaration}>}
 */
export async function getFontForNode(textNode, params = {}) {
    let style = getNodeStyle(textNode);
    let familyList = getStyleProp(textNode, style, 'fontFamily') ?? '';
    let wght       = getStyleProp(textNode, style, 'fontWeight');
    let ital       = getStyleProp(textNode, style, 'fontStyle');
    familyList = familyList.split(',').map(name => name.trim().replace(/^"|"$/g, ''));
    wght       = wghtMap[wght] || parseInt(wght) || 400;
    ital       = italMap[ital] || 0;
    let font, family;
    for (let item of familyList) {
        font = font || await getFont({family: item, wght, ital}, params);
        family = font && !family ? item : family;
    }
    if (!font) {
        let onFontNotFound = params.onFontNotFound;
        if (onFontNotFound === 'error') {
            throw new Error(`Font ${familyList.join(', ')} (wght: ${wght}, ital: ${ital}) not found`);
        } else if (onFontNotFound && typeof onFontNotFound === 'function') {
            font = onFontNotFound(textNode, familyList, wght, ital, params);
        }
    }
    if (!font && params.defaultFont) {
        font = await getFont(params.defaultFont, params);
    }
    return {font, fontStyle: {family, wght, ital}, style};
}

/**
 * Get opentype.js Path instances for svg <text> node (<tspan> not support there)
 * @param {SVGTextElement} textNode
 * @param {Object} [params]
 * @param {Boolean} [params.merged]
 * @returns {Promise<?import('opentype.js').Path[]>}
 */
export async function getPaths(textNode, params = {}) {
    let {font, style} = await getFontForNode(textNode, params);
    if (font) {
        let text = textNode.textContent;
        let x    = parseFloat(textNode.getAttributeNS(null, 'x'))        || 0;
        let y    = parseFloat(textNode.getAttributeNS(null, 'y'))        || 0;
        let size          = parseFloat(getStyleProp(textNode, style, 'fontSize'))      || 0;
        let letterSpacing = parseFloat(getStyleProp(textNode, style, 'letterSpacing')) || 0;
        let alignX        = getStyleProp(textNode, style, 'textAnchor');
        let alignY        = getStyleProp(textNode, style, 'dominantBaseline');
        let alignY2       = getStyleProp(textNode, style, 'alignmentBaseline');
        if (alignY2 !== 'auto' && alignY === 'auto') {
            alignY = alignY2;
        }
        let lParams = Object.assign({}, params);
        if (letterSpacing && size) {
            lParams.letterSpacing = letterSpacing / size;
        }
        switch (alignX) {
            case 'middle':
                x -= font.getAdvanceWidth(text, size, lParams) / 2;
                break;
            case 'end':
                x -= font.getAdvanceWidth(text, size, lParams);
                break;
        }
        switch (alignY) {
            case 'middle':
                y += font.tables.os2.sxHeight / font.unitsPerEm * size / 2;
                break;
            case 'text-after-edge':
                y += font.descender / font.unitsPerEm * size;
                break;
            case 'text-before-edge':
                y += font.ascender / font.unitsPerEm * size;
                break;
            case 'central':
                y += (font.ascender + font.descender) / font.unitsPerEm * size / 2;
                break;
        }
        if (params.merged) {
            return [font.getPath(text, x, y, size, lParams)];
        }
        return font.getPaths(text, x, y, size, lParams);
    }
    return null;
}

/**
 * Get opentype.js Path instance for svg <text> node (<tspan> not support there)
 * @param {SVGTextElement} textNode
 * @param {Object} [params]
 * @returns {Promise<?import('opentype.js').Path>}
 */
export async function getPath(textNode, params = {}) {
    let paths = await getPaths(textNode, Object.assign({merged: true}, params));
    return paths ? paths[0] : null;
}

/**
 * Replace svg <text> node with <path> node
 * @param {SVGTextElement} textNode
 * @param {Object} [params]
 * @param {Boolean} [params.group]
 * @param {String} [params.textAttr]
 * @param {Number} [params.decimals]
 * @returns {Promise<SVGPathElement|SVGPathElement[]|SVGGElement|null>}
 */
export async function replace(textNode, params = {}) {
    let group;
    if (textNode.querySelector('tspan')) {
        group = await convertTSpanText(textNode, params);
        textNode.parentNode.replaceChild(group, textNode);
        
        let promises = [];
        group.querySelectorAll('text').forEach(node => {
            let promise = replaceTextNode(node, params);
            promises.push(promise);
        });
        await Promise.all(promises);
    } else {
        group = await replaceTextNode(textNode, params)
    }
    if (group && params.textAttr && !Array.isArray(group)) {
        group.setAttributeNS(null, params.textAttr, textNode.innerHTML);
    }
    return group;
}

/**
 * Replace `<text>` elements in `<svg>`
 * @param {SVGSVGElement} svgElement
 * @param {Object} [params]
 * @param {String} [params.selector]
 * @returns {Promise<{total: Number, success: Number}>}
 */
export async function replaceAll(svgElement, params = {}) {
    const nodes = svgElement.querySelectorAll(params.selector || 'text');
    let promises = [];
    let stat = {total: 0, success: 0};
    nodes.forEach(node => {
        let promise = replace(node, params)
            .then(fragment => {
                stat.total++;
                fragment && stat.success++;
            });
        promises.push(promise);
    });
    await Promise.all(promises);
    return stat;
}

/**
 * Convert SVG element to string
 * @param {SVGSVGElement} svgElement 
 * @returns {String}
 */
export function svgToString(svgElement) {
    let serializer = makeSerializer(svgElement);
    return serializer.serializeToString(svgElement);
}

/**
 * Low-level load Font instance
 * @param {Object} style
 * @param {String} style.family
 * @param {Number} style.wght
 * @param {Number} style.ital
 * @param {Object} params
 * @param {Function[]} [params.handlers]
 * @returns {import('opentype.js').Font}
 */
async function loadFont(style, params) {
    let path;
    let handlers = params.handlers || getDefaultHandlers();
    for (let handler of handlers) {
        path = path || await handler(style, params);
    }
    if (!path || typeof path === 'object') {
        return path || null;
    }
    return await getFontInternal(path);
}

/**
 * Generate sting key for font style
 * @param {Object} style
 * @param {String} style.family
 * @param {Number} style.wght
 * @param {Number} style.ital
 * @returns {String}
 */
function getFontKey(style) {
    let {family, wght = 400, ital = 0} = style;
    return [family, wght, ital].join('/');
}

/**
 * Replace svg <text> node with <path> node (<tspan> not support there)
 * @param {SVGTextElement} textNode
 * @param {Object} [params]
 * @param {Boolean} [params.group]
 * @param {Number} [params.decimals]
 * @returns {Promise<SVGPathElement|SVGPathElement[]|SVGGElement|null>}
 */
async function replaceTextNode(textNode, params = {}) {
    const document = textNode.ownerDocument;
    let paths = await getPaths(textNode, params);
    if (!paths) {
        return null;
    }
    let group;
    if (!params.group || params.merged) {
        group = document.createDocumentFragment();
    } else {
        group = createElementFrom('g', textNode);
        copyAttributes(textNode, group, ['x', 'y']);
    }
    let result = [];
    paths.forEach(path => {
        let data = path.toPathData(params.decimals || 2);
        let pathNode = createElementFrom('path', textNode);
        if (!params.group || params.merged) {
            copyAttributes(textNode, pathNode, ['x', 'y']);
        }
        pathNode.setAttribute('d', data);
        group.appendChild(pathNode);
        result.push(pathNode);
    });
    textNode.parentNode.replaceChild(group, textNode);
    if (params.merged) {
        return result[0];
    } else {
        return params.group ? group : result;
    }
}