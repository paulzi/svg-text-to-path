import Session from "./Session.js";
import FontStyle from "./FontStyle.js";
import Cache from "./Cache.js";
import NoFontError from "./NoFontError.js";
import { getBufferFromSource } from "./shims/index.js";

/**
 * @typedef {import('./FontsProvider.js').default} FontsProvider
 * @typedef {import('./FontsSessionProvider.js').default} FontsSessionProvider
 * @typedef {import('./Font.js').default} Font
 * @typedef {import('./types.js').FontSource} FontSource
 * @typedef {import('./types.js').FontForChar} FontForChar
 * @typedef {import('./types.js').SessionProcessState} SessionProcessState
 */

export default class FontFactory {

    /**
     * @type {Session}
     */
    #session;

    /**
     * Font providers
     * @type {FontsSessionProvider[]}
     */
    #providers;
    
    /**
     * Session cache of family variants
     * @type {Map<String, FontSource[]>}
     */
    #cache;

    /**
     * Fonts cache
     * @type {Cache}
     */
    #fonts;

    /**
     * @param {Session} session
     * @param {FontsProvider[]} providers
     */
    constructor(session, providers) {
        this.#session = session;
        this.#cache   = new Map();
        this.#fonts   = session.params.fontCache || new Cache();
        this.createSessionProviders(providers);
    }

    /**
     * @param {FontsProvider[]} providers 
     */
    createSessionProviders(providers) {
        let sessionProviders = [];
        providers.forEach(provider => {
            sessionProviders.push(provider.createSession(this.#session));
        });
        this.#providers = sessionProviders;
    }

    /**
     * @param {String} family
     * @returns {Promise<FontSource[]>} 
     */
    async loadFamilyVariants(family) {
        let promises = this.#providers.map(provider => {
            return provider.getVariants(family);
        });
        let result = await Promise.all(promises);
        result = result.reduce((accum, item) => {
            return accum.concat(item);
        }, []);
        this.#cache.set(family, result);
        return result;
    }

    /**
     * @param {String} family
     * @returns {Promise<FontSource[]>} 
     */
    async getFamilyVariants(family) {
        let result = this.#cache.get(family);
        if (result) {
            return await result;
        }

        let promise = this.loadFamilyVariants(family);
        this.#cache.set(family, promise);
        return await promise;
    }

    /**
     * @param {String} family
     * @param {FontSource} variant
     * @returns {String}
     */
    getFontKey(family, variant) {
        let obj = {family};
        let axisDefault = FontStyle.axisDefault;
        Object.keys(axisDefault).forEach(axis => {
            obj[axis] = FontStyle.normalizeVariantAxis(variant, axis);
        });
        return JSON.stringify(obj);
    }

    /**
     * @param {FontSource} variant
     * @returns {Promise<Font|null>}
     */
    async loadFontForVariant(family, variant) {
        let renderer = this.#session.params.renderer || Session.defaultRenderer;
        try {
            let buffer = await getBufferFromSource(variant.source);
            return renderer.fontParse(family, variant, buffer);
        } catch {
            return null;
        }
    }

    /**
     * @param {String} family
     * @param {FontSource} variant
     * @returns {Promise<Font|null>}
     */
    async getFontForVariant(family, variant) {
        let key = this.getFontKey(family, variant);
        let result = this.#fonts.get(key);
        if (result) {
            return await result;
        }
        let promise = this.loadFontForVariant(family, variant);
        this.#fonts.set(key, promise);
        return await promise;
    }

    /**
     * @param {String} char 
     * @param {FontStyle} style
     * @param {String[]} families
     * @param {SessionProcessState} state
     * @param {Boolean} [isFallback]
     * @returns {Promise<FontForChar>}
     */
    async getFontForChar(char, style, families, state, isFallback = false) {
        let {familyClasses, fallbackFamilies, fallbackGlyph, noFontAction} = this.#session.params;
        for (let family of families || style.families) {
            let replace = familyClasses && familyClasses[family];
            if (replace) {
                let result = await this.getFontForChar(char, style, replace);
                if (result.font) {
                    return result;
                }
            }
            let variants = await this.getFamilyVariants(family);
            if (!variants.length) {
                state.missed.set(family, true);
            }
            let variant = style.getBestVariant(variants);
            if (variant) {
                let font = await this.getFontForVariant(family, variant);
                if (!font && !state.errors.get(variant)) {
                    state.errors.set(variant, {family, variant});
                }
                if (font && font.hasGlyph(char)) {
                    if (!style.match(variant)) {
                        let key = FontStyle.getKey(family, style.axes);
                        if (!state.warnings.get(key)) {
                            state.warnings.set(key, {family, axes: style.axes, variant});
                        }
                    }
                    return {font: font.getVariableFont(style, variant), char, style, isFallback};
                }
            }
        }
        if (!families) {
            if (fallbackFamilies && fallbackFamilies.length) {
                let result = await this.getFontForChar(char, style, fallbackFamilies, state);
                if (result.font) {
                    return result;
                }
            }
            if (fallbackGlyph) {
                let [family, char] = fallbackGlyph;
                if (typeof char === 'number') {
                    char = String.fromCodePoint(char);
                }
                let fallbackStyle = new FontStyle([family], style.axes, style.features);
                return await this.getFontForChar(char, fallbackStyle, [family], state, true);
            }
            if (['error', 'skipNode'].includes(noFontAction)) {
                throw new NoFontError(char, style, noFontAction === 'skipNode');
            }
        }
        return {font: null, char, style, isFallback};
    }
}