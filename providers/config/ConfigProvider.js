import FontsProvider from '../../src/FontsProvider.js';
import ConfigSessionProvider from './ConfigSessionProvider.js';

/**
 * @typedef {import('../../src/types.js').FontSourceMap} FontSourceMap
 * @typedef {import('../../src/types.js').SessionParams} SessionParams
 */

export default class ConfigProvider extends FontsProvider {
    
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
     * @param {SessionParams} params
     * @returns {ConfigProvider}
     */
    static create(params) {
        if (params.fonts) {
            return new ConfigProvider(params.fonts);
        }
        return null;
    }
    
    /**
     * @returns {ConfigSessionProvider}
     */
    createSession() {
        return new ConfigSessionProvider(this.#map);
    }
}
