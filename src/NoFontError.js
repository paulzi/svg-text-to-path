/**
 * @typedef {import('./FontStyle.js').default} FontStyle
 */


export default class NoFontError extends Error {
    
    /**
     * @type {String}
     */
    char;
    
    /**
     * @type {FontStyle}
     */
    style;

    /**
     * @type {Boolean}
     */
    skipNode;

    /**
     * @param {String} char 
     * @param {FontStyle} style 
     * @param {Boolean} skipNode 
     */
    constructor(char, style, skipNode) {
        super(`No font found for char '${char}' and families '${style.families.join(', ')}'`);
        this.char     = char;
        this.style    = style;
        this.skipNode = skipNode;
    }
}