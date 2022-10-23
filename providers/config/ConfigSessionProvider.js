import FontsSessionProvider from '../../src/FontsSessionProvider.js';

/**
 * @typedef {import('../../src/types.js').FontSource} FontSource
 * @typedef {import('../../src/types.js').FontSourceMap} FontSourceMap
 */

export default class ConfigSessionProvider extends FontsSessionProvider {
    
    /**
     * @type {FontSourceMap}
     */
    #map;

    /**
     * @param {FontSourceMap} map 
     */
    constructor(map) {
        super();
        this.#map = map;
    }
    
    /**
     * @param {String} family 
     * @returns {FontSource[]}
     */
    getVariants(family) {
        return this.#map?.[family] ?? [];
    }
}
