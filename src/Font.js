/**
 * @typedef {import('./FontStyle.js').default} FontStyle
 * @typedef {import('./types.js').FontSource} FontSource
 * @typedef {import('./types.js').FontMetrics} FontMetrics
 * @typedef {import('./types.js').FontFeatures} FontFeatures
 * @typedef {import('./types.js').FontGlyphPos} FontGlyphPos
 */

/**
 * @interface
 */
export default class Font {
    
    /**
     * @type {String}
     */
    #family;

    /**
     * @type {FontSource}
     */
    #variant;

    /**
     * @param {String} family
     * @param {FontSource} variant
     */
    constructor(family, variant) {
        this.#family  = family;
        this.#variant = variant;
    }

    /**
     * @returns {String}
     */
    get family() {
        return this.#family;
    }

    /**
     * @returns {FontSource}
     */
    get variant() {
        return this.#variant;
    }

    /**
     * @param {FontStyle} style 
     * @returns {Font}
     */
    getVariableFont() {
        return this;
    }

    /**
     * @method fontParse
     * @param {String} family
     * @param {FontSource} variant
     * @param {Buffer|ArrayBuffer} buffer
     * @returns {Font}
     */

    /**
     * @method getMetrics
     * @returns {FontMetrics}
     */

    /**
     * @method hasGlyph
     * @param {String} char 
     * @returns {Boolean}
     */

    /**
     * @method getGlyphsAndPos
     * @param {String} text
     * @param {Number} size
     * @param {FontFeatures} features
     * @returns {FontGlyphPos[]}
     */

    /**
     * @method getPath
     * @param {Object} glyph 
     * @param {Number} size 
     * @param {Number} x 
     * @param {Number} y
     * @param {Number} scaleX
     * @param {Number} decimals
     * @returns {String}
     */
}