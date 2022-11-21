import FontsSessionProvider from '../../src/FontsSessionProvider.js';
import { fetch } from '../../src/shims/index.js';

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
     * @type {Promise}
     */
    #promise;

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
        if (!this.#promise) {
            this.#promise = this.#parse();
        }
        await this.#promise;
        return this.#data[family] || [];
    }

    /**
     */
    async #parse() {
        this.#data = {};
        let styleSheets = this.#session.svg.ownerDocument.styleSheets;
        let promises = [];
        for (let i = 0, len = styleSheets.length; i < len; i++) {
            promises.push(this.#parseStyleSheet(styleSheets[i]));
        }
        await Promise.all(promises);
    }

    /**
     * @param {String} url 
     * @returns {CSSStyleSheet}
     */
    async #ajaxLoad(url) {
        let response = await fetch(url);
        let content = await response.text();
        let doc = document.implementation.createHTMLDocument();
        let style = doc.createElement('style');
        style.textContent = content;
        document.body.appendChild(style);
        return style.sheet;
    }

    /**
     * @param {CSSStyleSheet} styleSheet 
     */
    async #parseStyleSheet(styleSheet) {
        let rules;
        try {
            rules = styleSheet.cssRules;
        } catch {
            if (this.#session.params.useFontFaceAjax) {
                try {
                    styleSheet = await this.#ajaxLoad(styleSheet.href);
                    rules = styleSheet.cssRules;
                } catch {
                    rules = [];
                }
            } else {
                rules = [];
            }
        }
        for (let i = 0, len = rules.length; i < len; i++) {
            let rule = rules[i];
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
            let match = item.match(/url\(['"]?(\S+?)['"]?\)\s+format\(['"]?([a-z0-9]+)['"]?\)/);
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
