import { create } from 'fontkit';
import Font from '../src/Font.js';

/**
 * @typedef {import('../src/FontStyle.js').default} FontStyle
 * @typedef {import('../src/types.js').FontSource} FontSource
 * @typedef {import('../src/types.js').FontMetrics} FontMetrics
 * @typedef {import('../src/types.js').FontFeatures} FontFeatures
 * @typedef {import('../src/types.js').FontGlyphPos} FontGlyphPos
 */

export default class FontkitFont extends Font {
    
    /**
     * @type {import('fontkit').Font}
     */
    #font;

    /**
     * @param {String} family
     * @param {FontSource} variant
     * @param {import('fontkit').Font} font 
     */
    constructor(family, variant, font) {
        super(family, variant);
        this.#font = font;
    }

    /**
     * @param {String} family
     * @param {FontSource} variant
     * @param {Buffer|ArrayBuffer} buffer
     * @return {FontkitFont}
     */
    static fontParse(family, variant, buffer) {
        if (buffer instanceof ArrayBuffer) {
            buffer = new Uint8Array(buffer);
        }
        return new FontkitFont(family, variant, create(buffer));
    }

    /**
     * @returns {FontMetrics}
     */
    getMetrics() {
        let unitsPerEm = this.#font.unitsPerEm;
        return [
            'ascent',
            'descent',
            'capHeight',
            'xHeight',
        ].reduce((acc, prop) => {
            acc[prop] = this.#font[prop] / unitsPerEm;
            return acc;
        }, {});
    }

    /**
     * @param {String} char 
     * @returns {Boolean}
     */
    hasGlyph(char) {
        return this.#font.hasGlyphForCodePoint(char.codePointAt(0));
    }

    /**
     * @param {String} text
     * @param {Number} size
     * @param {FontFeatures} features
     * @returns {FontGlyphPos[]}
     */
    getGlyphsAndPos(text, size, features) {
        let scale = size / this.#font.unitsPerEm;
        let {glyphs, positions} = this.#font.layout(text, Object.assign({}, features));
        let result = [];
        for (let i = 0, len = glyphs.length; i < len; i++) {
            let pos = positions[i];
            result.push({
                glyph: glyphs[i],
                x:  scale * pos.xAdvance,
                y:  scale * pos.yAdvance,
                dx: scale * pos.xOffset,
                dy: scale * pos.yOffset,
            });
        }
        return result;
    }

    /**
     * @param {import('fontkit').Glyph} glyph 
     * @param {Number} size 
     * @param {Number} x 
     * @param {Number} y
     * @param {Number} scaleX
     * @param {Number} decimals
     * @returns {String}
     */
    getPath(glyph, size, x, y, scaleX, decimals) {
        let unitsPerEm = this.#font.unitsPerEm;
        return glyph.path
            .scale(scaleX * size / unitsPerEm, size / unitsPerEm)
            .scale(-1, 1)
            .rotate(Math.PI)
            .translate(x, y)
            .toSVG(); /** @todo: fontkit not support decimals */
    }

    /**
     * @param {FontStyle} style 
     * @returns {FontkitFont}
     */
    getVariableFont(style) {
        let variations = this.#font.variationAxes;
        let request = {};
        let isVariable = false;
        Object.entries(style.axes).forEach(([axis, value]) => {
            if (variations[axis]) {
                request[axis] = value;
                isVariable = true;
            }
        });
        return isVariable ? new FontkitFont(this.family, this.variant, this.#font.getVariation(request)) : this;
    }
}