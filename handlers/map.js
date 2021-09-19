import { getFontMod } from '../src/misc.js';

/**
 * Get font path/url from map
 * @param {Object} style
 * @param {String} style.family
 * @param {Number} style.wght
 * @param {Number} style.ital
 * @param {Object} params
 * @param {Object} params.fontMap
 * @returns {?String}
 */
export default function(style, params) {
    return params.fontMap
        && params.fontMap[style.family]
        && params.fontMap[style.family][getFontMod(style)]
        || null;
}