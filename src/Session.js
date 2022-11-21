import FontFactory from "./FontFactory.js";
import FontStyle from "./FontStyle.js";
import NoFontError from "./NoFontError.js";
import Cache from "./Cache.js";
import { applyPromiseMap, copyAttributes, createElementFrom, getNodeStyle } from "./misc.js";
import { getStyleProp, parseSvgLength, parseSvgString } from "./shims/index.js";

/**
 * @typedef {import('./FontsProvider.js').default} FontsProvider
 * @typedef {import('./Font.js').default} Font
 * @typedef {import('./types.js').TextGroup} TextGroup
 * @typedef {import('./types.js').SessionParams} SessionParams
 * @typedef {import('./types.js').SessionStat} SessionStat
 * @typedef {import('./types.js').SessionReplaceStat} SessionReplaceStat
 * @typedef {import('./types.js').SessionTextStyle} SessionTextStyle
 * @typedef {import('./types.js').SessionProcessState} SessionProcessState
 * @typedef {import('./types.js').SessionLayoutState} SessionLayoutState
 */

// position props
const posProps = ['x', 'y', 'dx', 'dy'];

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

// CSS font-stretch to wdth map
const wdthMap = {
    'ultra-condensed': 50,
    'extra-condensed': 62.5,
    'condensed':       75,
    'semi-condensed':  87.5,
    'normal':          100,
    'semi-expanded':   112.5,
    'expanded':        125,
    'extra-expanded':  150,
    'ultra-expanded':  200,
};

// attributes to remove from <text> and <tspan> converted to <g>
const deleteAttr = posProps.concat([
    'lengthAdjust',
    'textLength',
    'text-anchor',
    'dominant-baseline',
    'letter-spacing',
    /^font-/,
]);

export default class Session {

    /**
     * @type {Boolean}
     */
    #fromString;

    /**
     * @type {SVGSVGElement}
     */
    #svg;

    /**
     * @type {SessionParams}
     */
    #params;

    /**
     * @type {FontFactory}
     */
    #fontFactory;

    /**
     * @param {SVGSVGElement|String} svg
     * @param {SessionParams} params
     */
    constructor(svg, params = {}) {
        this.#fromString  = typeof svg === 'string';
        this.#svg         = this.#fromString ? parseSvgString(svg, params.loadResources) : svg;
        this.#params      = params;
        let providers     = this.#params.providers || this.#createDefaultProviders();
        this.#fontFactory = new FontFactory(this, providers);
    }

    /**
     * @returns {SessionParams}
     */
    get params() {
        return this.#params;
    }

    /**
     * @returns {SVGSVGElement}
     */
    get svg() {
        return this.#svg;
    }

    /**
     * Return SVG as string
     * @returns {String}
     */
    getSvgString() {
        let win = this.#svg.ownerDocument.defaultView;
        let serializer = new win.XMLSerializer();
        return serializer.serializeToString(this.#svg);
    }

    /**
     * Destroy session and remove temporary SVG (parsed from string) from DOM
     */
    destroy() {
        if (this.#fromString) {
            const div = this.#svg.parentNode;
            div && div.parentNode.removeChild(div);
        }
        this.#svg         = null;
        this.#params      = null;
        this.#fontFactory = null;
    }

    /**
     * Return FontStyle for the node
     * @param {SVGElement} node
     * @param {CSSStyleDeclaration} [style]
     * @returns {FontStyle}
     */
    getFontStyleForNode(node, style) {
        style = style || getNodeStyle(node);
        let val = getStyleProp(node, style, 'fontFamily') ?? '';
        let families = val.split(',').map(name => name.trim().replace(/^"|"$|^'|'$/g, ''));
        let axes = {};
        val = getStyleProp(node, style, 'fontWeight');
        axes.wght = wghtMap[val] || parseInt(val) || 400;
        val = getStyleProp(node, style, 'fontStyle');
        axes.ital = italMap[val] || 0;
        if (val && val.slice(0, 7) === 'oblique') {
            axes.slnt = val.slice(8) ? -parseFloat(val.slice(8)) || 0 : -14;
        }
        val = getStyleProp(node, style, 'fontStretch');
        if (val && val !== 'normal' && val !== '100%') {
            axes.wdth = wdthMap[val] || parseInt(val) || 100;
        }
        val = getStyleProp(node, style, 'fontVariationSettings');
        if (val && val !== 'normal') {
            val = val.split(',');
            val.forEach(item => {
                let match = item.match(/["']([a-zA-Z]{4})["']\s+(-?[\d.]+)/);
                if (match) {
                    axes[match[1]] = parseFloat(match[2]);
                }
            });
        }
        let features = {};
        val = getStyleProp(node, style, 'fontKerning');
        if (val === 'none') {
            features.kern = 0;
        }
        val = getStyleProp(node, style, 'fontFeatureSettings');
        if (val && val !== 'normal') {
            val = val.split(',');
            val.forEach(item => {
                let match = item.match(/["']([a-zA-Z]{4})["'](?:\s+(on|off|\d+))?/);
                if (match) {
                    let value = ['off', 'on'].indexOf(match[2] ?? 'on');
                    features[match[1]] = value === -1 ? parseInt(match[2]) : value;
                }
            });
        }
        return new FontStyle(families, axes, features);
    }

    /**
     * Process all <text> by selector
     * @param {String} selector 
     * @returns {Promise<SessionStat>} 
     */
    async replaceAll(selector = 'text') {
        const nodes = this.#svg.querySelectorAll(selector);
        let replaced = 0;
        let promises = new Map();
        nodes.forEach(node => {
            promises.set(node, this.replace(node));
        });
        await applyPromiseMap(promises);
        let used     = new Map();
        let skipped  = 0;
        let missed   = new Map();
        let warnings = new Map();
        let errors   = new Map();
        promises.forEach(stat => {
            if (!stat) {
                return;
            }
            replaced++;
            stat.textMap.forEach(groups => {
                groups.forEach(({text, font, isFallback}) => {
                    let chars = Array.from(text).length;
                    if (font && !isFallback) {
                        let item = used.get(font.variant);
                        if (!item) {
                            item = {family: font.family, variant: font.variant, chars: 0};
                            used.set(font.variant, item);
                        }
                        item.chars += chars;
                    } else {
                        skipped += chars;
                    }
                });
            });
            stat.missed.forEach(family => {
                missed.set(family, true);
            });
            stat.warnings.forEach(item => {
                let key = FontStyle.getKey(item.family, item.axes);
                warnings.set(key, item);
            });
            stat.errors.forEach(item => {
                errors.set(item.variant, item);
            });
        });
        return {
            total:    nodes.length,
            replaced,
            used:     Array.from(used.values()),
            skipped,
            missed:   Array.from(missed.keys()),
            warnings: Array.from(warnings.values()),
            errors:   Array.from(errors.values()),
        };
    }

    /**
     * Process <text> node
     * @param {SVGTextElement} node
     * @returns {Promise<SessionReplaceStat>}
     */
    async replace(node) {
        let loadingPromise = this.#svg._svgTextToPathPromise;
        loadingPromise && await loadingPromise;
        let textMap  = new Map();
        let missed   = new Map();
        let warnings = new Map();
        let errors   = new Map();
        let lastText = this.#findLastTextNode(node);
        try {
            this.#processChildNodes(node, textMap, {
                missed,
                warnings,
                errors,
                lastChar: ' ',
                lastText,
            });
            await applyPromiseMap(textMap);
        } catch (e) {
            if (e instanceof NoFontError && e.skipNode) {
                return;
            }
            throw e;
        }
        for (let [textNode, groups] of textMap.entries()) {
            if (!groups.length) {
                textMap.delete(textNode);
            }
        }
        this.#layoutChildNodes(node, textMap, {});
        return {
            textMap,
            missed:   Array.from(missed.keys()),
            warnings: Array.from(warnings.values()),
            errors:   Array.from(errors.values()),
        };
    }

    /**
     * Create cache for font
     * @param {Number} [duration] 
     * @returns {Cache}
     */
    createCache(duration) {
        return new Cache(duration);
    }

    /**
     * Create FontsProvider from default static providers list
     * @returns {FontsProvider[]}
     */
    #createDefaultProviders() {
        let result = [];
        (Session.defaultProviders || []).forEach(providerClass => {
            let provider = providerClass.create && providerClass.create(this.#params);
            provider && result.push(provider);
        });
        return result;
    }

    /**
     * Return last text node with text (trim spaces)
     * @param {SVGTextElement} node
     * @returns {?Text}
     */
    #findLastTextNode(node) {
        if (node.nodeType === 3) { // Node.TEXT_NODE
            if (/[^\t\n\r ]/.test(node.textContent)) {
                return node;
            }
        } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
            let result;
            let childs = Array.prototype.slice.call(node.childNodes);
            for (let child of childs) {
                result = this.#findLastTextNode(child) || result;
            }
            return result;
        }
    }

    /**
     * Processing step (load fonts, build TextGroup map)
     * @param {Node} node
     * @param {Map<Text, Promise<TextGroup[]>>} textMap
     * @param {SessionProcessState} state
     */
    #processChildNodes(node, textMap, state) {
        if (node.nodeType === 3) { // Node.TEXT_NODE
            let promise = this.#processTextNode(node, state);
            textMap.set(node, promise);
        } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
            let childs = Array.prototype.slice.call(node.childNodes);
            for (let child of childs) {
                this.#processChildNodes(child, textMap, state);
            }
        }
    }

    /**
     * Processing step for text node (load fonts, build TextGroup map)
     * @param {Text} node
     * @param {SessionProcessState} state
     * @returns {Promise<TextGroup[]>}
     */
    async #processTextNode(node, state) {
        if (state.ignore) {
            return [];
        }
        let style = getNodeStyle(node.parentNode);
        let fontStyle = this.getFontStyleForNode(node.parentNode, style);
        let chars = node.textContent.replace(/[\t\n\r ]+/g, ' ');
        chars = Array.from(chars);
        if (chars[0] === ' ' && state.lastChar === ' ') {
            chars.splice(0, 1);
        }
        if (chars.length) {
            state.lastChar = chars[chars.length - 1];
        }
        if (node === state.lastText) {
            state.ignore = true;
            if (chars[chars.length - 1] === ' ') {
                chars.splice(-1, 1);
            }
        }
        let promises = new Map();
        for (let char of chars) {
            let promise = promises.get(char);
            if (!promise) {
                promise = this.#fontFactory.getFontForChar(char, fontStyle, null, state);
                promises.set(char, promise);
            }
        }
        await applyPromiseMap(promises);
        return this.#makeTextGroups(chars, promises);
    }

    /**
     * Groups a sequence of chars with the same font
     * @param {String[]} chars 
     * @param {Map<Text, Font} map
     * @returns {TextGroup[]}
     */
    #makeTextGroups(chars, map) {
        let groups = [];
        let text = '', prev;
        for (let i = 0, len = chars.length; i < len; i++) {
            let {font, char, style, isFallback} = map.get(chars[i]);
            if (i > 0 && prev !== font) {
                groups.push({text, font: prev, style, isFallback});
                text = '';
            }
            text += char;
            prev = font;
            if (i === len - 1) {
                groups.push({text, font, style, isFallback});
            }
        }
        return groups;
    }

    /**
     * Layout step (calculate glyphs positions)
     * @param {Node} node
     * @param {Map<Text, TextGroup[]>} textMap
     * @param {SessionLayoutState} state
     */
    #layoutChildNodes(node, textMap, state) {
        if (node.nodeType === 3) { // Node.TEXT_NODE
            let groups = textMap.get(node);
            groups && this.#layoutTextNode(node, groups, state);
        } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
            this.#layoutOpenElementNode(node, state);
            let childs = Array.prototype.slice.call(node.childNodes); // todo
            for (let child of childs) {
                this.#layoutChildNodes(child, textMap, state);
            }
            this.#layoutCloseElementNode(node, state);
        }
    }

    /**
     * Layout step for tag open (calculate glyphs positions)
     * @param {SVGTextElement|SVGTSpanElement} node
     * @param {SessionLayoutState} state
     */
    #layoutOpenElementNode(node, state) {
        if (!state.stack) {
            state.stack    = [];
            state.tagStart = [];
            state.chars    = 0;
        }
        this.#removePosForUsedChars(state);
        posProps.forEach(prop => {
            state[prop] = state[prop] || [];
            state[prop].push(parseSvgLength(node, prop));
        });
        state.tagStart.push(state.stack.length);
    }

    /**
     * Layout step for tag close (calculate glyphs positions)
     * @param {SVGTextElement|SVGTSpanElement} node
     * @param {SessionLayoutState} state
     */
    #layoutCloseElementNode(node, state) {
        this.#correctLength(node, state);
        posProps.forEach(prop => {
            state[prop].pop();
        });
        if (node.nodeName === 'text') {
            this.#renderStack(state, true);
        }
        let g = createElementFrom('g', node);
        copyAttributes(node, g, this.#params.keepFontAttrs ? null : deleteAttr);
        while (node.childNodes.length) {
            g.appendChild(node.firstChild);
        }
        node.parentNode.replaceChild(g, node);
    }

    /**
     * Layout step for textnode (calculate glyphs positions)
     * @param {Text} node
     * @param {TextGroup[]} groups
     * @param {SessionLayoutState} state
     */
    #layoutTextNode(node, groups, state) {
        let style = this.#parseStyle(node.parentNode);
        let props = this.#normalizePosProps(state);
        groups.forEach(({text, font, style: fontStyle}) => {
            state.style = state.style || style;
            let glyphs = font ? font.getGlyphsAndPos(text, style.size, fontStyle.features) : [];
            glyphs.forEach(({glyph, x, y, dx, dy}) => {
                let char = state.chars++;
                if (state.stack.length && (char < props.x.length || char < props.y.length)) {
                    this.#renderStack(state);
                    state.style = style;
                }
                if (char < props.x.length || char < props.y.length) {
                    if (char < props.x.length) {
                        state.cx = props.x[char];
                    }
                    if (char < props.dx.length) {
                        state.cx += props.dx[char];
                        props.dx[char] = 0;
                    }
                    state.sx = state.cx;
                }
                if (char < props.y.length) {
                    state.cy = props.y[char];
                    if (char < props.dy.length) {
                        state.cy += props.dy[char];
                        props.dy[char] = 0;
                    }
                }
                state.cx = state.cx ?? 0;
                state.cy = state.cy ?? 0;
                /*
                // correct implementation disabled due to implementation in all browsers
                // https://drafts.csswg.org/css-text/#letter-spacing-property
                // "UAs therefore really should not [RFC6919] append letter spacing to the right or trailing edge of a line"
                if (state.stack.length) {
                    state.cx += style.spacing;
                }
                */
                state.cx += props.dx[char] ?? 0;
                state.cy += props.dy[char] ?? 0;
                switch (style.alignY) {
                    case 'middle':
                        dy += font.getMetrics().xHeight * style.size / 2;
                        break;
                    case 'ideographic':
                    case 'text-after-edge':
                        dy += font.getMetrics().descent * style.size;
                        break;
                    case 'text-before-edge':
                        dy += font.getMetrics().ascent * style.size;
                        break;
                    case 'central':
                        dy += (font.getMetrics().ascent + font.getMetrics().descent) * style.size / 2;
                        break;
                    case 'mathematical':
                        dy += font.getMetrics().ascent * style.size / 2;
                        break;
                    case 'hanging':
                        dy += font.getMetrics().ascent * style.size * 0.8;
                        break;
                }
                state.stack.push({
                    node,
                    font,
                    glyph,
                    size: style.size,
                    x: state.cx + dx,
                    y: state.cy + dy,
                    w: x,
                    spacing: style.spacing,
                });
                state.xMin = Math.min(state.xMin ?? Infinity, state.cx);
                state.cx += x + style.spacing;
                state.cy += y;
                state.xMax = Math.max(state.xMax ?? -Infinity, state.cx);
            });
        });
    }

    /**
     * Glyph position correction depending on textLength attribute
     * @param {SVGTextElement|SVGTSpanElement} node
     * @param {SessionLayoutState} state
     */
    #correctLength(node, state) {
        let start = state.tagStart.pop();
        let end = state.stack.length;
        if (!node.hasAttributeNS(null, 'textLength')) {
            return;
        }
        let length = parseSvgLength(node, 'textLength')[0] ?? null;
        if (length === null || end <= start) {
            return;
        }
        let isScaling = node.getAttributeNS(null, 'lengthAdjust') === 'spacingAndGlyphs';
        let items = 0;
        let fixed = 0;
        let min, max;
        let prev;
        for (let i = start; i < end; i++) {
            let item = state.stack[i];
            min = Math.min(min ??  Infinity, item.x);
            max = Math.max(max ?? -Infinity, item.x + item.w);
            if (item.fix && (i === end - 1 || item.fix !== state.stack[i + 1].fix)) {
                fixed += item.x + item.w - state.stack[item.fix - 1].x;
            }
            if (!item.fix || item.fix !== prev) {
                items++;
                prev = item.fix;
            }
        }
        if (items === 0) {
            return;
        }
        let scale = (length - fixed) / (max - min - fixed);
        let dx = 0;
        let last = length - max + min;
        if (items > 1) {
            dx = last / (items - 1);
            last = 0;
        }
        let delta = 0;
        for (let i = start, len = state.stack.length; i < len; i++) {
            let item = state.stack[i];
            item.x += delta;
            if (isScaling) {
                if (!item.fix) {
                    item.scale = scale;
                    item.w *= scale;
                    item.spacing *= scale;
                }
            }
            let width = item.w + item.spacing;
            state.xMin = Math.min(state.xMin ?? Infinity, item.x);
            state.xMax = Math.max(state.xMax ?? -Infinity, item.x + width);
            if (i < end) {
                if (isScaling && !item.fix) {
                    delta += width - width / scale;
                }
                if (!isScaling && (!item.fix || item.fix !== state.stack[i + 1].fix)) {
                    delta += i === end - 1 ? last : dx;
                }
                item.fix = item.fix || (start + 1);
            }
            if (i === len - 1) {
                state.cx = item.x + width;
            }
        }
    }

    /**
     * Rendering step
     * @param {SessionLayoutState} state
     * @param {Boolean} [isFinal]
     */
    #renderStack(state, isFinal) {
        let {split, textAttr, decimals} = this.#params;
        state.merge = state.merge ?? '';
        let process = () => {
            let prev = state.prev;
            if (split) {
                prev.parentNode.removeChild(prev);
            } else {
                let path = createElementFrom('path', prev.parentNode);
                path.setAttribute('d', state.merge);
                textAttr && path.setAttribute(textAttr, prev.textContent);
                prev.parentNode.replaceChild(path, prev);
                state.merge = '';
            }
        };
        let dx = 0;
        if (state.stack.length) {
            state.sx = state.sx || 0;
            dx = state.sx - state.xMin;
            switch (state.style.alignX) {
                case 'middle':
                    dx += (state.xMin - state.xMax) / 2;
                    break;
                case 'end':
                    dx = state.sx - state.xMax;
                    break;
            }
        }
        state.stack.forEach(({node, font, glyph, size, x, y, scale}) => {
            if (state.prev && state.prev !== node) {
                process();
            }
            let d = font.getPath(glyph, size, x + dx, y, scale ?? 1, decimals ?? 2);
            if (split) {
                let path = createElementFrom('path', node.parentNode);
                path.setAttribute('d', d);
                node.parentNode.insertBefore(path, node);
            } else {
                state.merge += d;
            }
            state.prev = node;
        });
        isFinal && state.stack.length && process();
        state.xMin = state.xMax = state.style = undefined;
        state.stack = [];
    }

    /**
     * Normalize stack of position attributes
     * @param {SessionLayoutState} state 
     * @returns {{[key: String]: Number[]}>}
     */
    #normalizePosProps(state) {
        let props = {};
        posProps.forEach(prop => {
            props[prop] = [];
            state[prop].forEach(values => {
                values.forEach((val, i) => {
                    props[prop][i] = val;
                });
            });
        });
        return props;
    }

    /**
     * Remove used chars from position attributes stack
     * @param {SessionLayoutState} state 
     */
    #removePosForUsedChars(state) {
        let chars = state.chars;
        if (chars > 0) {
            posProps.forEach(prop => {
                state[prop].forEach(values => {
                    values.splice(0, chars);
                });
            });
        }
        state.chars = 0;
    }

    /**
     * Parse text node styles for layout step
     * @param {SVGTextElement|SVGTSpanElement} node
     * @returns {SessionTextStyle}
     */
    #parseStyle(node) {
        let style = getNodeStyle(node);
        let size    = parseFloat(getStyleProp(node, style, 'fontSize'))      || 0;
        let spacing = parseFloat(getStyleProp(node, style, 'letterSpacing')) || 0;
        let alignX  = getStyleProp(node, style, 'textAnchor');
        let alignY  = getStyleProp(node, style, 'dominantBaseline');
        let alignY2 = getStyleProp(node, style, 'alignmentBaseline');
        if (alignY2 !== 'auto' && alignY === 'auto') {
            alignY = alignY2;
        }
        return {size, spacing, alignX, alignY};
    }
}