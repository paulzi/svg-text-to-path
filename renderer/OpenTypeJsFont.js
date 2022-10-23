import { parse } from 'opentype.js';
import Font from '../src/Font.js';

/**
 * @typedef {import('../src/FontStyle.js').default} FontStyle
 * @typedef {import('../src/types.js').FontSource} FontSource
 * @typedef {import('../src/types.js').FontMetrics} FontMetrics
 * @typedef {import('../src/types.js').FontFeatures} FontFeatures
 * @typedef {import('../src/types.js').FontGlyphPos} FontGlyphPos
 */

export default class OpenTypeJsFont extends Font {
    
    /**
     * @type {import('opentype.js').Font}
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
     * @return {OpenTypeJsFont}
     */
    static fontParse(family, variant, buffer) {
        if (!(buffer instanceof ArrayBuffer)) {
            buffer = buffer.buffer;
        }
        return new OpenTypeJsFont(family, variant, parse(buffer));
    }

    /**
     * @returns {FontMetrics}
     */
    getMetrics() {
        let font = this.#font;
        let unitsPerEm = font.unitsPerEm;
        return {
            ascent:    font.ascender              / unitsPerEm,
            descent:   font.descender             / unitsPerEm,
            capHeight: font.tables.os2.sCapHeight / unitsPerEm,
            xHeight:   font.tables.os2.sxHeight   / unitsPerEm,
        }
    }

    /**
     * @param {String} char 
     * @returns {Boolean}
     */
    hasGlyph(char) {
        return !!this.#font.charToGlyphIndex(char);
    }

    /**
     * @param {String} text
     * @param {Number} size
     * @param {FontFeatures} features
     * @returns {FontGlyphPos[]}
     */
    getGlyphsAndPos(text, size, features) {
        let font = this.#font;
        let scale = size / font.unitsPerEm;
        let options = Object.assign({}, font.defaultRenderOptions, {features});
        if (features.kern !== undefined) {
            options.kerning = features.kern;
        }
        let glyphs = font.stringToGlyphs(text, options);
        let kerningLookups;
        if (options.kerning) {
            const script = options.script || font.position.getDefaultScriptName();
            kerningLookups = font.position.getKerningTables(script, options.language);
        }
        let result = [];
        for (let i = 0; i < glyphs.length; i++) {
            let glyph = glyphs[i];
            let kerningValue = 0;
            if (options.kerning && i < glyphs.length - 1) {
                kerningValue = kerningLookups ?
                      font.position.getKerningValue(kerningLookups, glyph.index, glyphs[i + 1].index) :
                      font.getKerningValue(glyph, glyphs[i + 1]);
            }
            result.push({
                glyph: glyph,
                x:  scale * (glyph.advanceWidth + kerningValue),
                y:  0,
                dx: 0,
                dy: 0,
            });
        }
        return result;
    }

    /**
     * @param {import('opentype.js').Glyph} glyph 
     * @param {Number} size 
     * @param {Number} x 
     * @param {Number} y
     * @param {Number} scaleX
     * @param {Number} decimals
     * @returns {String}
     */
    getPath(glyph, size, x, y, scaleX, decimals) {
        let xScale = scaleX * size / this.#font.unitsPerEm;
        let path = glyph.getPath(x, y, size, {xScale});
        return path.toPathData(decimals);
    }
}