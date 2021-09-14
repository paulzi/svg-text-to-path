import internal from './internal.js';

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
 * Get Font instance for font style
 * @param {Object} style
 * @param {String} style.family
 * @param {Number} style.wght
 * @param {Number} style.ital
 * @param {Object} [params]
 * @returns {import('opentype.js').Font}
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
export async function setFont(style, font) {
    fonts.set(getFontKey(style), font);
}

/**
 * Get opentype.js Font instance for svg <text> node
 * @param {SVGTextElement} textNode 
 * @param {Object} [params]
 * @param {String|Function} [params.onFontNotFound]
 * @param {Object} [params.defaultFont]
 * @returns {{font: null|import('opentype.js').Font, fontStyle: Object, style: Object}}
 */
export async function getFontForNode(textNode, params = {}) {
    const document = textNode.ownerDocument;
    const getComputedStyle = document.defaultView.getComputedStyle;
    let style = getComputedStyle(textNode);
    let familyList = style.fontFamily.split(',').map(name => name.trim().replace(/^"|"$/g, ''));
    let wght = wghtMap[style.fontWeight] || parseInt(style.fontWeight) || 400;
    let ital = italMap[style.fontStyle] || 0;
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
 * Get opentype.js Path instances for svg <text> node
 * @param {SVGTextElement} textNode
 * @param {Object} [params]
 * @param {Boolean} [params.merged]
 * @returns {null|import('opentype.js').Path[]}
 */
export async function getPaths(textNode, params = {}) {
    let {font, style} = await getFontForNode(textNode, params);
    if (font) {
        let text = textNode.textContent;
        let x    = parseFloat(textNode.getAttributeNS(null, 'x')) || 0;
        let y    = parseFloat(textNode.getAttributeNS(null, 'y')) || 0;
        let size = parseInt(style.fontSize) || 0;
        let alignX = style.textAnchor;
        let alignY = style.dominantBaseline;
        switch (alignX) {
            case 'middle':
                x -= font.getAdvanceWidth(text, size, params) / 2;
                break;
            case 'end':
                x -= font.getAdvanceWidth(text, size, params);
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
            return [font.getPath(text, x, y, size, params)];
        }
        return font.getPaths(text, x, y, size, params);
    }
    return null;
}

/**
 * Get opentype.js Path instance for svg <text> node
 * @param {SVGTextElement} textNode
 * @param {Object} params
 * @returns {null|import('opentype.js').Path}
 */
export async function getPath(textNode, params) {
    let paths = await getPaths(textNode, Object.assign({merged: true}, params));
    return paths ? paths[0] : null;
}

/**
 * Replace svg <text> node with <path> node
 * @param {SVGTextElement} textNode
 * @param {Object} [params]
 * @param {Number} [params.decimals]
 * @returns {?SVGPathElement[]}
 */
export async function replace(textNode, params = {}) {
    const document = textNode.ownerDocument;
    let paths = await getPaths(textNode, params);
    if (!paths) {
        return null;
    }
    let group;
    if (!params.group || params.merged) {
        group = document.createDocumentFragment();
    } else {
        group = document.createElementNS(textNode.namespaceURI, 'g');
        if (params.textAttr) {
            group.setAttribute(params.textAttr, textNode.textContent);
        }
    }
    let result = [];
    paths.forEach(path => {
        let data = path.toPathData(params.decimals || 2);
        let pathNode = document.createElementNS(textNode.namespaceURI, 'path');
        copyAttributes(textNode, pathNode, ['x', 'y']);
        pathNode.setAttribute('d', data);
        if (params.textAttr && params.merged) {
            pathNode.setAttribute(params.textAttr, textNode.textContent);
        }
        group.appendChild(pathNode);
        result.push(pathNode);
    });
    textNode.parentNode.replaceChild(group, textNode);
    return result;
}

/**
 * Replace svg <text> nodes in svg element with <path> nodes
 * @param {SVGTextElement} textNode
 * @param {Object} [params]
 * @param {String} [params.selector]
 * @returns {{total: Number, success: Number}}
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
    let handlers = params.handlers || internal.handlers;
    for (let handler of handlers) {
        path = path || await handler(style, params);
    }
    return path ? await internal.getFontInternal(path, params) : null;
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
 * Copy all attributes
 * @param {SVGElement} source
 * @param {SVGElement} target
 * @param {String[]} [except]
 */
function copyAttributes(source, target, except) {
    for (let i = 0, len = source.attributes.length; i < len; i++) {
        let node = source.attributes[i];
        if (!except || except.indexOf(node.name) === -1) {
            target.setAttribute(node.name, node.value);
        }
    }
}