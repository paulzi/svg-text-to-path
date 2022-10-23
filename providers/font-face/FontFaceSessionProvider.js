import FontsSessionProvider from '../../src/FontsSessionProvider.js';

/**
 * @typedef {import('../../src/Session.js').default} Session
 * @typedef {import('../../src/types.js').FontSource} FontSource
 * @typedef {import('../../src/types.js').FontSourceMap} FontSourceMap
 */

export default class FontFaceSessionProvider extends FontsSessionProvider {
    
    /**
     * @type {Session}
     */
    #session;

    /**
     * @type {FontSourceMap}
     */
    #data;

    /**
     * @param {Session} session
     */
    constructor(session) {
        super();
        this.#session = session;
    }

    /**
     * @param {String} family
     * @returns {Promise<FontSource[]>}
     */
    async getVariants(family) {
        if (!this.#data) {
            this.#parse();
        }
        return this.#data[family] || [];
    }

    /**
     */
    #parse() {
        this.#data = {};
        let styleSheets = this.#session.svg.ownerDocument.styleSheets;
        for (let i = 0, len = styleSheets.length; i < len; i++) {
            this.#parseStyleSheet(styleSheets[i]);
        }
    }

    /**
     * @param {CSSStyleSheet} styleSheet 
     */
    #parseStyleSheet(styleSheet) {
        for (let i = 0, len = styleSheet.cssRules.length; i < len; i++) {
            let rule = styleSheet.cssRules[i];
            rule.styleSheet && this.#parseStyleSheet(rule.styleSheet);
            if (rule.constructor.name === 'CSSFontFaceRule') {
                this.#parseFontFace(rule);
            }
        }
    }

    /**
     * @param {CSSFontFaceRule} rule 
     */
    #parseFontFace(rule) {
        let getProp = (prop) => {
            return rule.style.getPropertyValue(prop);
        };
        let family = getProp('font-family').trim().replace(/^"|"$|^'|'$/g, '');
        let source;
        for (let item of getProp('src').split(',')) {
            let match = item.match(/url\(['"]?([\S^)]+)['"]?\)\s+format\(['"]?([a-z0-9]+)['"]?\)/);
            if (match) {
                if (['truetype', 'opentype', 'woff', 'woff2'].includes(match[2])) {
                    source = match[1];
                    break;
                }
            }
        }
        if (!source) {
            return;
        }
        let match;
        let variant = {source};
        match = getProp('font-weight').match(/^([\d.]+)(?:\s+([\d.]+))?$/);
        if (match) {
            match = match.slice(1).filter(v => v).map(parseFloat);
            variant.wght = match.length > 1 ? match : match[0];
        }
        match = getProp('font-style');
        if (match === 'italic') {
            variant.ital = 1;
        } else if (match === 'oblique') {
            variant.slnt = -14;
        } else {
            match = match.match(/^oblique\s+([\d.-]+)deg(?:\s+([\d.-]+)deg)$/);
            if (match) {
                match = match.slice(1).reverse().filter(v => v).map(v => -parseFloat(v));
                variant.slnt = match.length > 1 ? match : match[0];
            }
        }
        let variants = this.#data[family];
        if (!variants) {
            variants = [];
            this.#data[family] = variants;
        }
        variants.push(variant);
    }
}