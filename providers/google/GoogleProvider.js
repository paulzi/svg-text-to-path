import HttpProvider from '../http/HttpProvider.js';

/**
 * @typedef {import('../../src/types.js').FontSource} FontSource
 * @typedef {import('../../src/types.js').FontSourceMap} FontSourceMap
 * @typedef {import('../../src/types.js').SessionParams} SessionParams
 */

/**
 * @typedef {Object} GoogleFontsFamily
 * @property {String} family
 * @property {[key: String]: String} files
 */

/**
 * @typedef {Object} GoogleFontsResponse
 * @property {GoogleFontsFamily[]} items
 */

export default class GoogleProvider extends HttpProvider {
    
    /**
     * @type {String}
     */
    #apiKey;

    /**
     * @param {String} apiKey
     * @param {?Number} [cache]
     */
    constructor(apiKey, cache) {
        super('', cache);
        this.#apiKey = apiKey;
    }

    /**
     * @param {SessionParams} params 
     * @returns {GoogleProvider}
     */
    static create(params) {
        if (params.googleApiKey) {
            return new GoogleProvider(params.googleApiKey, params.googleCache ?? null);
        }
        return null;
    }

    /**
     * @returns {String} 
     */
    getUrl() {
        return 'https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key='
            + encodeURIComponent(this.#apiKey);
    }

    /**
     * @param {GoogleFontsResponse} data
     * @return {FontSourceMap}
     */
    processData(data) {
        let map = {};
        data.items.forEach(item => {
            let variants = [];
            Object.entries(item.files).forEach(([type, source]) => {
                let wght, ital;
                if (type === 'regular') {
                    wght = 400;
                    ital = 0;
                } else {
                    wght = parseInt(type);
                    ital = type.slice(-6) === 'italic' ? 1 : 0;
                }
                variants.push({
                    wght,
                    ital,
                    source: source.replace('http://', 'https://'),
                });
            });
            map[item.family] = variants;
        });
        return map;
    }
}